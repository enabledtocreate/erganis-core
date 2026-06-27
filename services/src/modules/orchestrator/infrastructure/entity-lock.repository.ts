import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

@Injectable()
export class EntityLockRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async getVersion(orgId: string, entityPublicId: string): Promise<number | null> {
    return this.queryOne(
      `SELECT version FROM platform.entity_versions
       WHERE org_id = $1 AND entity_public_id = $2`,
      [orgId, entityPublicId],
      (row) => row.version as number,
    );
  }

  async incrementVersion(orgId: string, entityPublicId: string): Promise<number> {
    const row = await this.queryOne(
      `INSERT INTO platform.entity_versions (org_id, entity_public_id, version)
       VALUES ($1, $2, 1)
       ON CONFLICT (org_id, entity_public_id) DO UPDATE SET
         version = platform.entity_versions.version + 1,
         updated_at = now()
       RETURNING version`,
      [orgId, entityPublicId],
      (r) => r.version as number,
    );
    return row ?? 1;
  }

  async tryAcquireLock(input: {
    orgId: string;
    entityPublicId: string;
    operationId: string;
    userId: string;
    ttlSeconds: number;
  }): Promise<boolean> {
    await this.execute(
      `DELETE FROM platform.entity_locks WHERE expires_at < now()`,
    );
    const result = await this.query(
      `INSERT INTO platform.entity_locks
         (org_id, entity_public_id, operation_id, locked_by_user_id, expires_at)
       VALUES ($1, $2, $3, $4, now() + ($5 || ' seconds')::interval)
       ON CONFLICT (org_id, entity_public_id) DO NOTHING
       RETURNING operation_id`,
      [
        input.orgId,
        input.entityPublicId,
        input.operationId,
        input.userId,
        String(input.ttlSeconds),
      ],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async releaseLock(
    orgId: string,
    entityPublicId: string,
    operationId: string,
  ): Promise<void> {
    await this.execute(
      `DELETE FROM platform.entity_locks
       WHERE org_id = $1 AND entity_public_id = $2 AND operation_id = $3`,
      [orgId, entityPublicId, operationId],
    );
  }
}
