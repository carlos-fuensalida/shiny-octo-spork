import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionPayload } from './interfaces/session-payload.interface';

describe('AuthController', () => {
  let authService: jest.Mocked<
    Pick<AuthService, 'login' | 'logout' | 'toUserDto'>
  >;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let controller: AuthController;

  const payload: SessionPayload = {
    sub: 'usr-123',
    email: 'j.smith@whirlpool.com',
    displayName: 'John Smith',
    sessionStart: Date.now(),
  };

  beforeEach(() => {
    authService = { login: jest.fn(), logout: jest.fn(), toUserDto: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('http://localhost:3000') };
    controller = new AuthController(
      authService as unknown as AuthService,
      configService as unknown as ConfigService,
    );
  });

  it('login() issues the session and redirects to the frontend root', async () => {
    const redirect = jest.fn();
    const res = { redirect } as unknown as Response;

    await controller.login(res);

    expect(authService.login).toHaveBeenCalledWith(res);
    expect(configService.get).toHaveBeenCalledWith('FRONTEND_BASE_URL');
    expect(redirect).toHaveBeenCalledWith(HttpStatus.FOUND, 'http://localhost:3000/');
  });

  it('login() throws when FRONTEND_BASE_URL is missing', async () => {
    configService.get.mockReturnValueOnce(undefined);
    const res = { redirect: jest.fn() } as unknown as Response;

    await expect(controller.login(res)).rejects.toThrow('FRONTEND_BASE_URL is not configured');
    expect(authService.login).toHaveBeenCalledWith(res);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('login() throws when FRONTEND_BASE_URL is invalid', async () => {
    configService.get.mockReturnValueOnce('not-a-valid-url');
    const res = { redirect: jest.fn() } as unknown as Response;

    await expect(controller.login(res)).rejects.toThrow('FRONTEND_BASE_URL is invalid');
    expect(authService.login).toHaveBeenCalledWith(res);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('me() returns the mapped user for the authenticated session', () => {
    const dto = {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
    };
    authService.toUserDto.mockReturnValue(dto);
    const req = { user: payload } as unknown as Request;

    expect(controller.me(req)).toBe(dto);
    expect(authService.toUserDto).toHaveBeenCalledWith(payload);
  });

  it('logout() clears the session', () => {
    const res = {} as Response;

    controller.logout(res);

    expect(authService.logout).toHaveBeenCalledWith(res);
  });

  it('validate() returns valid: true with the session expiry set by the guard', () => {
    const req = {
      sessionExpiresAt: '2026-07-15T18:00:00.000Z',
    } as unknown as Request;

    expect(controller.validate(req)).toEqual({
      valid: true,
      expiresAt: '2026-07-15T18:00:00.000Z',
    });
  });
});
