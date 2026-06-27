import { Module } from '@nestjs/common';
import { CompositionController } from './composition.controller';

@Module({
  controllers: [CompositionController],
})
export class CompositionModule {}
