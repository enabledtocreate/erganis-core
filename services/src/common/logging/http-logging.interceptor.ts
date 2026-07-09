import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (url.startsWith('/health')) {
            return;
          }
          const res = context.switchToHttp().getResponse<Response>();
          this.logger.log(`${method} ${url} ${res.statusCode} ${Date.now() - started}ms`);
        },
        error: (error: { status?: number; message?: string }) => {
          const status = error?.status ?? 500;
          const message = error?.message ?? 'request failed';
          this.logger.warn(
            `${method} ${url} ${status} ${Date.now() - started}ms — ${message}`,
          );
        },
      }),
    );
  }
}
