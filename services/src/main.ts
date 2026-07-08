import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { StructuredExceptionFilter } from './common/structured-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new StructuredExceptionFilter());
  app.use(cookieParser());
  const config = app.get(ConfigService);
  const port = config.get<number>('port', 5000);
  const host = config.get<string>('host', '0.0.0.0');
  await app.listen(port, host);
}

bootstrap();
