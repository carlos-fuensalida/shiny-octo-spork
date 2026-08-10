import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

export class UnauthorizedApiException extends ApiException {
  constructor(
    message = 'Missing, invalid, or expired session cookie.',
    details?: unknown,
  ) {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED, details);
  }
}
