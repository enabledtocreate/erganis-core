import { Injectable } from '@nestjs/common';
import { OperationResult } from '@erganis/platform';
import { JobQueueService } from '../jobs/job-queue.service';
import { PLATFORM_JOBS } from '../jobs/platform-jobs';
import {
  OperationLogRepository,
  OutboxRepository,
} from './platform-repositories';

@Injectable()
export class PlatformEventService {
  constructor(
    private readonly operationLog: OperationLogRepository,
    private readonly outbox: OutboxRepository,
    private readonly jobs: JobQueueService,
  ) {}

  async recordOperation(input: {
    result: OperationResult;
    orgId: string;
    userId?: string;
  }): Promise<void> {
    await this.operationLog.append({
      operationId: input.result.operationId,
      orgId: input.orgId,
      surfaceId: input.result.surfaceId,
      action: input.result.action,
      outcome: input.result.outcome,
      userId: input.userId,
    });
    await this.outbox.enqueue('operation.completed', {
      operationId: input.result.operationId,
      orgId: input.orgId,
      outcome: input.result.outcome,
      surfaceId: input.result.surfaceId,
      action: input.result.action,
    });
  }

  async enqueueJob(jobType: string, payload: Record<string, unknown>): Promise<void> {
    await this.jobs.send(jobType, payload);
  }

  async enqueueSearchIndex(payload: Record<string, unknown>): Promise<void> {
    await this.jobs.send(PLATFORM_JOBS.searchIndex, payload);
  }
}
