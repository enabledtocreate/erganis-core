import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { DatabaseService } from '../database/database.service';
import { AuthModule } from '../auth/auth.module';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { UserRepository } from '../auth/infrastructure/user.repository';
import { LoaderModule } from '../loader/loader.module';
import { OrchestratorService } from './orchestrator.service';
import { OperationsController } from './operations.controller';

@Module({
  imports: [LoaderModule, AuthModule],
  controllers: [OperationsController],
  providers: [
    OrchestratorService,
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: UserRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(UserRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
