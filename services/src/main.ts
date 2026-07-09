import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { StructuredExceptionFilter } from './common/structured-exception.filter';
import { resolveNestLogLevels } from './common/logging/log-level.util';

async function bootstrap(): Promise<void> {
  const logLevels = resolveNestLogLevels(process.env.LOG_LEVEL);
  const app = await NestFactory.create(AppModule, { logger: logLevels });
  app.useGlobalFilters(new StructuredExceptionFilter());
  app.use(cookieParser());

  const config = app.get(ConfigService);
  const corsOrigins = config.get<string>('corsOrigins', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const port = config.get<number>('port', 5000);
  const host = config.get<string>('host', '0.0.0.0');
  await app.listen(port, host);
}

bootstrap();
