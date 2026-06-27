import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PublicApiController } from './public-api.controller';

@Module({
  imports: [AuthModule],
  controllers: [PublicApiController],
})
export class PublicApiModule {}
