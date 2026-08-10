import { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UnauthorizedApiException } from '../../../common/exceptions/api-exception';
import { SESSION_COOKIE_NAME } from '../constants';
import { SessionPayload } from '../interfaces/session-payload.interface';
import { SessionService } from '../session.service';
import { SessionAuthGuard } from './session-auth.guard';

function createContext(
  request: Partial<Request>,
  response: Partial<Response>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('SessionAuthGuard', () => {
  let sessionService: jest.Mocked<Pick<SessionService, 'verify' | 'reissue'>>;
  let guard: SessionAuthGuard;

  const payload: SessionPayload = {
    sub: 'usr-123',
    email: 'j.smith@whirlpool.com',
    displayName: 'John Smith',
    sessionStart: Date.now(),
  };

  beforeEach(() => {
    sessionService = { verify: jest.fn(), reissue: jest.fn() };
    guard = new SessionAuthGuard(sessionService as unknown as SessionService);
  });

  it('rejects when no session cookie is present', () => {
    const request: Partial<Request> = { cookies: {} };
    const context = createContext(request, {});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedApiException);
    expect(sessionService.verify).not.toHaveBeenCalled();
  });

  it('propagates the session service rejection for an invalid/expired token', () => {
    const request: Partial<Request> = {
      cookies: { [SESSION_COOKIE_NAME]: 'bad-token' },
    };
    const context = createContext(request, {});
    sessionService.verify.mockImplementation(() => {
      throw new UnauthorizedApiException();
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedApiException);
  });

  it('verifies, reissues the cookie, and attaches the session to the request on success', () => {
    const request: Partial<Request> = {
      cookies: { [SESSION_COOKIE_NAME]: 'good-token' },
    };
    const response: Partial<Response> = {};
    const context = createContext(request, response);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    sessionService.verify.mockReturnValue(payload);
    sessionService.reissue.mockReturnValue({ expiresAt });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(sessionService.verify).toHaveBeenCalledWith('good-token');
    expect(sessionService.reissue).toHaveBeenCalledWith(payload, response);
    expect(request.user).toEqual(payload);
    expect(request.sessionExpiresAt).toBe(expiresAt.toISOString());
  });
});
