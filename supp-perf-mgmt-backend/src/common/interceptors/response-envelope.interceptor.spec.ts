import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

function createContext(requestId: string, headersSent: boolean) {
  const request = { requestId };
  const response = { headersSent };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

function handlerReturning(value: unknown): CallHandler {
  return { handle: () => of(value) };
}

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps a handled return value in { data, meta } with the requestId', (done) => {
    const interceptor = new ResponseEnvelopeInterceptor();
    const context = createContext('req-1', false);

    interceptor
      .intercept(context, handlerReturning({ id: 'usr-123' }))
      .subscribe((result) => {
        expect(result).toEqual({
          data: { id: 'usr-123' },
          meta: { requestId: 'req-1' },
        });
        done();
      });
  });

  it('passes the value through untouched when the handler already sent the response (redirects, manual 204s)', (done) => {
    const interceptor = new ResponseEnvelopeInterceptor();
    const context = createContext('req-2', true);

    interceptor
      .intercept(context, handlerReturning(undefined))
      .subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
  });
});
