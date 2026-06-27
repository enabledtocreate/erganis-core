import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { JobModule } from '../jobs/job.module';
import {
  OperationLogRepository,
  OutboxRepository,
} from './platform-repositories';
import { PlatformEventService } from './platform-event.service';

@Module({
  imports: [JobModule, DatabaseModule],
  providers: [
    PlatformEventService,
    {
      provide: OperationLogRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OperationLogRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: OutboxRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OutboxRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [PlatformEventService, OutboxRepository],
})
export class PlatformServicesModule {}
