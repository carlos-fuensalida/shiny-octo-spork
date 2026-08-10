import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IDENTITY_PROVIDER } from './constants';
import { StubIdentityProvider } from './identity/stub-identity.provider';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { SessionService } from './session.service';

@Module({
  imports: [
    JwtModule.register({
      secret:
        process.env.SESSION_JWT_SECRET || 'dev-only-insecure-secret-change-me',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    SessionAuthGuard,
    { provide: IDENTITY_PROVIDER, useClass: StubIdentityProvider },
  ],
})
export class AuthModule {}
