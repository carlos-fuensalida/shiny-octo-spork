import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { IDENTITY_PROVIDER } from './constants';
import { UserDto } from './dto/user.dto';
import type { IdentityProvider } from './identity/identity-provider.interface';
import { SessionPayload } from './interfaces/session-payload.interface';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_PROVIDER)
    private readonly identityProvider: IdentityProvider,
    private readonly sessionService: SessionService,
  ) {}

  async login(response: Response): Promise<void> {
    const identity = await this.identityProvider.getIdentity();
    this.sessionService.issue(identity, response);
  }

  logout(response: Response): void {
    this.sessionService.clear(response);
  }

  toUserDto(payload: SessionPayload): UserDto {
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
    };
  }
}
