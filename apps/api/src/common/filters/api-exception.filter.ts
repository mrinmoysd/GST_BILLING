import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function isTechnicalMessage(message: string) {
  const lowered = message.toLowerCase();
  return [
    'prisma',
    'sql',
    'stack',
    'exception',
    'trace',
    'jwt',
    'fetch',
    'request failed',
    'econn',
    'invalid `prisma',
  ].some((token) => lowered.includes(token));
}

function toDetails(input: unknown) {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object') return input;
  return undefined;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, code, message, details } =
      this.normalizeException(exception);

    this.logger.error(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl ?? req.url,
        status,
        code,
        message,
        rawError:
          exception instanceof Error
            ? exception.message
            : typeof exception === 'string'
              ? exception
              : 'Unknown error',
        details,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ErrorBody = {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };

    res.status(status).json(body);
  }

  private normalizeException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message:
            'A record with the same unique value already exists.',
        };
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'The requested record could not be found.',
        };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      let code = this.defaultCodeForStatus(status);
      let message = this.defaultMessageForStatus(status);
      let details: unknown;

      if (typeof response === 'string') {
        if (status < 500 && !isTechnicalMessage(response)) {
          message = response;
        }
      } else if (response && typeof response === 'object') {
        const payload = response as {
          error?: string;
          code?: string;
          message?: string | string[];
          details?: unknown;
        };

        if (payload.code && typeof payload.code === 'string') {
          code = payload.code;
        }

        if (Array.isArray(payload.message)) {
          details = payload.message;
          message =
            status === HttpStatus.BAD_REQUEST
              ? 'Please review the highlighted fields and try again.'
              : message;
        } else if (
          typeof payload.message === 'string' &&
          status < 500 &&
          !isTechnicalMessage(payload.message)
        ) {
          message = payload.message;
        }

        if (payload.details !== undefined) {
          details = payload.details;
        }
      }

      if (
        exception instanceof BadRequestException &&
        details === undefined &&
        typeof response === 'object' &&
        response !== null
      ) {
        const payload = response as { message?: unknown };
        details = toDetails(payload.message);
      }

      return {
        status,
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong on our side. Please try again.',
    };
  }

  private defaultCodeForStatus(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'AUTH_REQUIRED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED';
    }
  }

  private defaultMessageForStatus(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Please review the request and try again.';
      case HttpStatus.UNAUTHORIZED:
        return 'Your session has expired. Please sign in again.';
      case HttpStatus.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      case HttpStatus.NOT_FOUND:
        return 'The requested resource could not be found.';
      case HttpStatus.CONFLICT:
        return 'This action conflicts with the current data. Refresh and try again.';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Too many requests right now. Please wait a moment and try again.';
      default:
        return status >= 500
          ? 'Something went wrong on our side. Please try again.'
          : 'Request failed. Please try again.';
    }
  }
}
