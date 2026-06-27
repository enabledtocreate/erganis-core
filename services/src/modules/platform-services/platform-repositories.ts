import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';
import { OperationResult } from '@erganis/platform';

@Injectable()
export class OperationLogRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async append(input: {
    operationId: string;
    orgId: string;
    surfaceId: string;
    action: string;
    outcome: OperationResult['outcome'];
    userId?: string;
  }): Promise<void> {
    await this.execute(
      `INSERT INTO platform.operation_log
         (operation_id, org_id, surface_id, action, outcome, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.operationId,
        input.orgId,
        input.surfaceId,
        input.action,
        input.outcome,
        input.userId ?? null,
      ],
    );
  }
}

@Injectable()
export class OutboxRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async enqueue(eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.execute(
      `INSERT INTO platform.outbox_events (event_type, payload) VALUES ($1, $2::jsonb)`,
      [eventType, JSON.stringify(payload)],
    );
  }
}

@Injectable()
export class JobQueueRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async enqueue(jobType: string, payload: Record<string, unknown>): Promise<void> {
    await this.execute(
      `INSERT INTO platform.job_queue (job_type, payload) VALUES ($1, $2::jsonb)`,
      [jobType, JSON.stringify(payload)],
    );
  }
}
