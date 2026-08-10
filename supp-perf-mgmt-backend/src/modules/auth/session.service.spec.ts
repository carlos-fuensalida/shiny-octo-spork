import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { UnauthorizedApiException } from '../../common/exceptions/api-exception';
import { SESSION_ABSOLUTE_CAP_MS, SESSION_COOKIE_NAME } from './constants';
import { AuthenticatedIdentity } from './identity/identity-provider.interface';
import { SessionService } from './session.service';

function createMockResponse() {
  return {
    cookie: jest.fn<Response, [string, string, Record<string, unknown>]>(),
    clearCookie: jest.fn<Response, [string, Record<string, unknown>]>(),
  };
}

const identity: AuthenticatedIdentity = {
  id: 'usr-123',
  email: 'j.smith@whirlpool.com',
  displayName: 'John Smith',
};

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    service = new SessionService(new JwtService({ secret: 'test-secret' }));
  });

  it('issues a session cookie with the correct name, security flags, and ~60-minute expiry', () => {
    const res = createMockResponse();

    const { expiresAt } = service.issue(identity, res as unknown as Response);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [name, token, options] = res.cookie.mock.calls[0];
    expect(name).toBe(SESSION_COOKIE_NAME);
    expect(typeof token).toBe('string');
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + 59 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 60 * 60 * 1000,
    );
  });

  it('verifies a freshly issued token and returns the identity claims', () => {
    const res = createMockResponse();
    service.issue(identity, res as unknown as Response);
    const token = res.cookie.mock.calls[0][1];

    const payload = service.verify(token);

    expect(payload).toMatchObject({
      sub: identity.id,
      email: identity.email,
      displayName: identity.displayName,
    });
  });

  it('rejects a tampered or malformed token', () => {
    expect(() => service.verify('not-a-real-token')).toThrow(
      UnauthorizedApiException,
    );
  });

  it('rejects a token from a different secret', () => {
    const otherService = new SessionService(
      new JwtService({ secret: 'other-secret' }),
    );
    const res = createMockResponse();
    otherService.issue(identity, res as unknown as Response);
    const token = res.cookie.mock.calls[0][1];

    expect(() => service.verify(token)).toThrow(UnauthorizedApiException);
  });

  it('reissues a token with a refreshed sliding-window expiry, preserving identity and sessionStart', () => {
    const res = createMockResponse();
    service.issue(identity, res as unknown as Response);
    const firstToken = res.cookie.mock.calls[0][1];
    const firstPayload = service.verify(firstToken);

    const { expiresAt: secondExpiresAt } = service.reissue(
      firstPayload,
      res as unknown as Response,
    );
    const secondToken = res.cookie.mock.calls[1][1];
    const secondPayload = service.verify(secondToken);

    expect(secondPayload).toEqual(firstPayload);
    expect(secondExpiresAt.getTime()).toBeGreaterThanOrEqual(
      Date.now() + 59 * 60 * 1000,
    );
  });

  it('rejects a session that has exceeded the 8-hour absolute cap, even with a token still inside its sliding window', () => {
    const res = createMockResponse();
    const staleSessionStart = Date.now() - (SESSION_ABSOLUTE_CAP_MS + 60_000);

    // reissue() lets us sign a token with a real (valid) exp while carrying an
    // artificially old sessionStart, isolating the absolute-cap check from the
    // sliding-window check.
    service.reissue(
      {
        sub: identity.id,
        email: identity.email,
        displayName: identity.displayName,
        sessionStart: staleSessionStart,
      },
      res as unknown as Response,
    );
    const token = res.cookie.mock.calls[0][1];

    expect(() => service.verify(token)).toThrow(UnauthorizedApiException);
  });

  it('clears the session cookie by name with matching security flags', () => {
    const res = createMockResponse();

    service.clear(res as unknown as Response);

    expect(res.clearCookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      }),
    );
  });
});
