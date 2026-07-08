import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { EventModule } from '../events/event.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowDefinitionRepository } from './workflow-definition.repository';
import { WorkflowInstanceRepository } from './workflow-instance.repository';
import { WorkflowEventHandler } from './workflow-event.handler';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [DatabaseModule, AuthModule, EventModule],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    WorkflowEventHandler,
    {
      provide: WorkflowDefinitionRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(WorkflowDefinitionRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: WorkflowInstanceRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(WorkflowInstanceRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [WorkflowService],
})
export class WorkflowModule {}
