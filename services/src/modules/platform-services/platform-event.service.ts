import { Injectable } from '@nestjs/common';
import { OperationResult } from '@erganis/platform';
import {
  JobQueueRepository,
  OperationLogRepository,
  OutboxRepository,
} from './platform-repositories';

@Injectable()
export class PlatformEventService {
  constructor(
    private readonly operationLog: OperationLogRepository,
    private readonly outbox: OutboxRepository,
    private readonly jobs: JobQueueRepository,
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
      outcome: input.result.outcome,
      surfaceId: input.result.surfaceId,
      action: input.result.action,
    });
  }

  async enqueueJob(jobType: string, payload: Record<string, unknown>): Promise<void> {
    await this.jobs.enqueue(jobType, payload);
  }
}
