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

  async fetchPending(
    limit: number,
  ): Promise<Array<{ id: string; eventType: string; payload: Record<string, unknown> }>> {
    return this.queryMany(
      `SELECT id, event_type, payload
       FROM platform.outbox_events
       WHERE published = false
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
      (row) => ({
        id: String(row.id),
        eventType: String(row.event_type),
        payload: row.payload as Record<string, unknown>,
      }),
    );
  }

  async markPublished(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.execute(
      `UPDATE platform.outbox_events SET published = true WHERE id = ANY($1::uuid[])`,
      [ids],
    );
  }
}

@Injectable()
export class JobQueueRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  /** @deprecated Use pg-boss via {@link JobQueueService} instead. */
  async enqueue(jobType: string, payload: Record<string, unknown>): Promise<void> {
    await this.execute(
      `INSERT INTO platform.job_queue (job_type, payload) VALUES ($1, $2::jsonb)`,
      [jobType, JSON.stringify(payload)],
    );
  }
}
