import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { CodeRuleRepository } from './codes.repository';
import { CodesController } from './codes.controller';
import { CodesProviderService } from './codes-provider.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CodesController],
  providers: [
    CodesProviderService,
    {
      provide: CodeRuleRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(CodeRuleRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [CodesProviderService],
})
export class CodesModule {}
