import { Injectable } from '@nestjs/common';
import {
  AuthenticatedIdentity,
  IdentityProvider,
} from './identity-provider.interface';

@Injectable()
export class StubIdentityProvider implements IdentityProvider {
  getIdentity(): Promise<AuthenticatedIdentity> {
    return Promise.resolve({
      id: 'usr-123',
      email: 'j.smith@whirlpool.com',
      displayName: 'John Smith',
    });
  }
}
