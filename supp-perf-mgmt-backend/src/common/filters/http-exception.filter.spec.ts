import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiException } from '../exceptions/api-exception';
import { HttpExceptionFilter } from './http-exception.filter';

type JsonSpy = jest.Mock<void, [Record<string, unknown>]>;

function createHost(requestId: string, jsonSpy: JsonSpy) {
  const response = { status: jest.fn().mockReturnThis(), json: jsonSpy };
  const request = { requestId };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  it('formats an ApiException using its own code and details', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn<void, [Record<string, unknown>]>();
    const host = createHost('req-1', json);

    filter.catch(
      new ApiException('UNAUTHORIZED', 'nope', HttpStatus.UNAUTHORIZED, {
        reason: 'x',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        message: 'nope',
        requestId: 'req-1',
        details: { reason: 'x' },
      },
    });
  });

  it('maps a plain NestJS HttpException status to the standard error code', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn<void, [Record<string, unknown>]>();
    const host = createHost('req-2', json);

    filter.catch(new NotFoundException('missing'), host);

    expect(json.mock.calls[0][0]).toMatchObject({
      error: { code: 'NOT_FOUND', requestId: 'req-2' },
    });
  });

  it('joins class-validator style message arrays into a single string', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn<void, [Record<string, unknown>]>();
    const host = createHost('req-3', json);

    filter.catch(
      new BadRequestException(['field a is required', 'field b is invalid']),
      host,
    );

    expect(json.mock.calls[0][0]).toMatchObject({
      error: { message: 'field a is required, field b is invalid' },
    });
  });

  it('falls back to a generic 500 INTERNAL_ERROR for non-HTTP exceptions', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn<void, [Record<string, unknown>]>();
    const host = createHost('req-4', json);

    filter.catch(new Error('boom'), host);

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected server error.',
        requestId: 'req-4',
        details: undefined,
      },
    });
  });
});
