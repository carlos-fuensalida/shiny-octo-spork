import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { UnauthorizedApiException } from '../../../common/exceptions/api-exception';
import { SESSION_COOKIE_NAME } from '../constants';
import { SessionService } from '../session.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new UnauthorizedApiException();
    }

    const payload = this.sessionService.verify(token);
    const { expiresAt } = this.sessionService.reissue(payload, response);

    request.user = payload;
    request.sessionExpiresAt = expiresAt.toISOString();
    return true;
  }
}
