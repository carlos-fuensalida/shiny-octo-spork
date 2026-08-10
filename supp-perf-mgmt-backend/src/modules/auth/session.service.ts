import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UnauthorizedApiException } from '../../common/exceptions/api-exception';
import { AuthenticatedIdentity } from './identity/identity-provider.interface';
import { SessionPayload } from './interfaces/session-payload.interface';
import {
  SESSION_ABSOLUTE_CAP_MS,
  SESSION_COOKIE_NAME,
  SESSION_SLIDING_WINDOW_SECONDS,
} from './constants';

interface IssuedSession {
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(private readonly jwtService: JwtService) {}

  issue(identity: AuthenticatedIdentity, response: Response): IssuedSession {
    const payload: SessionPayload = {
      sub: identity.id,
      email: identity.email,
      displayName: identity.displayName,
      sessionStart: Date.now(),
    };
    return this.sign(payload, response);
  }

  reissue(payload: SessionPayload, response: Response): IssuedSession {
    return this.sign(payload, response);
  }

  verify(token: string): SessionPayload {
    let decoded: SessionPayload;
    try {
      decoded = this.jwtService.verify<SessionPayload>(token);
    } catch {
      throw new UnauthorizedApiException();
    }

    if (Date.now() - decoded.sessionStart > SESSION_ABSOLUTE_CAP_MS) {
      throw new UnauthorizedApiException(
        'Session exceeded the 8-hour absolute limit; re-authentication required.',
      );
    }

    // Strip jsonwebtoken's `iat`/`exp` claims — re-signing with a payload that
    // already carries `exp` conflicts with the `expiresIn` option.
    return {
      sub: decoded.sub,
      email: decoded.email,
      displayName: decoded.displayName,
      sessionStart: decoded.sessionStart,
    };
  }

  clear(response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
  }

  private sign(payload: SessionPayload, response: Response): IssuedSession {
    const token = this.jwtService.sign(payload, {
      expiresIn: SESSION_SLIDING_WINDOW_SECONDS,
    });
    const expiresAt = new Date(
      Date.now() + SESSION_SLIDING_WINDOW_SECONDS * 1000,
    );
    response.cookie(SESSION_COOKIE_NAME, token, {
      ...cookieOptions(),
      expires: expiresAt,
    });
    return { expiresAt };
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    // Unset in local dev -> host-only cookie. Set to ".<parent-domain>" in
    // deployed environments so the frontend subdomain receives it too.
    domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
  };
}
