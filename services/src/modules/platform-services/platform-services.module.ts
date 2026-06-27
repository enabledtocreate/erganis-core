import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { DatabaseService } from '../database/database.service';
import {
  JobQueueRepository,
  OperationLogRepository,
  OutboxRepository,
} from './platform-repositories';
import { PlatformEventService } from './platform-event.service';

@Module({
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
    {
      provide: JobQueueRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(JobQueueRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [PlatformEventService],
})
export class PlatformServicesModule {}
