import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();

    return next.handle().pipe(
      map((data: unknown) => {
        // Handlers that already wrote the response themselves (redirects, 204s
        // sent via @Res()) must not be re-serialized.
        if (response.headersSent || data === undefined) {
          return data;
        }
        return { data, meta: { requestId: request.requestId } };
      }),
    );
  }
}
