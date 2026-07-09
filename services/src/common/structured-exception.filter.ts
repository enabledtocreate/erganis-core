import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { StructuredPlatformError } from '@erganis/platform';

const RECOVERABLE_CODES = new Set([
  'VERSION_CONFLICT',
  'LOCK_CONFLICT',
  'SYNC_CONFLICT',
  'MODULE_DISABLED',
  'OPERATION_DISABLED',
]);

@Catch()
export class StructuredExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(StructuredExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request =
      typeof ctx.getRequest === 'function'
        ? ctx.getRequest<{ method?: string; url?: string }>()
        : undefined;

    const body = this.toStructuredError(exception);
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(
        `${request?.method ?? '?'} ${request?.url ?? '?'} ${status} ${body.code}: ${body.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request?.method ?? '?'} ${request?.url ?? '?'} ${status} ${body.code}: ${body.message}`,
      );
    }

    response.status(status).json({
      error: body,
      outcome: status >= 500 ? 'failed' : undefined,
    });
  }

  private toStructuredError(exception: unknown): StructuredPlatformError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      if (typeof raw === 'object' && raw !== null && 'code' in raw) {
        const obj = raw as Record<string, unknown>;
        return {
          code: String(obj.code),
          message: String(obj.message ?? exception.message),
          field: obj.field ? String(obj.field) : undefined,
          recoverable: RECOVERABLE_CODES.has(String(obj.code)),
          details: this.stripCodeMessage(obj),
        };
      }
      return {
        code: this.statusToCode(status),
        message:
          typeof raw === 'string'
            ? raw
            : typeof raw === 'object' && raw !== null && 'message' in raw
              ? String((raw as { message: unknown }).message)
              : exception.message,
        recoverable: status < 500 && status !== HttpStatus.UNPROCESSABLE_ENTITY,
      };
    }

    if (exception instanceof Error) {
      return {
        code: 'INTERNAL_ERROR',
        message: exception.message,
        recoverable: false,
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      recoverable: false,
    };
  }

  private statusToCode(status: number): string {
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    if (status === HttpStatus.UNPROCESSABLE_ENTITY) return 'VALIDATION_FAILED';
    return 'HTTP_ERROR';
  }

  private stripCodeMessage(obj: Record<string, unknown>): Record<string, unknown> | undefined {
    const { code: _c, message: _m, field: _f, ...rest } = obj;
    return Object.keys(rest).length > 0 ? rest : undefined;
  }
}
