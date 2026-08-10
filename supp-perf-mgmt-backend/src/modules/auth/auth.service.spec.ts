import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  AuthenticatedIdentity,
  IdentityProvider,
} from './identity/identity-provider.interface';
import { SessionPayload } from './interfaces/session-payload.interface';
import { SessionService } from './session.service';

describe('AuthService', () => {
  let identityProvider: jest.Mocked<IdentityProvider>;
  let sessionService: jest.Mocked<Pick<SessionService, 'issue' | 'clear'>>;
  let service: AuthService;

  const identity: AuthenticatedIdentity = {
    id: 'usr-123',
    email: 'j.smith@whirlpool.com',
    displayName: 'John Smith',
  };

  beforeEach(() => {
    identityProvider = { getIdentity: jest.fn().mockResolvedValue(identity) };
    sessionService = { issue: jest.fn(), clear: jest.fn() };
    service = new AuthService(
      identityProvider,
      sessionService as unknown as SessionService,
    );
  });

  it('login() resolves the identity and issues a session for it', async () => {
    const res = {} as Response;

    await service.login(res);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- asserting on the jest mock, not invoking it as a bound method
    expect(identityProvider.getIdentity).toHaveBeenCalled();
    expect(sessionService.issue).toHaveBeenCalledWith(identity, res);
  });

  it('logout() clears the session', () => {
    const res = {} as Response;

    service.logout(res);

    expect(sessionService.clear).toHaveBeenCalledWith(res);
  });

  it('toUserDto() maps session claims to the User shape', () => {
    const payload: SessionPayload = {
      sub: identity.id,
      email: identity.email,
      displayName: identity.displayName,
      sessionStart: Date.now(),
    };

    expect(service.toUserDto(payload)).toEqual({
      id: identity.id,
      email: identity.email,
      displayName: identity.displayName,
    });
  });
});
