import { DbUnitOfWork, DbUnitOfWorkFactory, QueryClient } from '@erganis/platform';
import { Pool, PoolClient } from 'pg';
import { asQueryClient } from './pg-query-client';

class PgUnitOfWork implements DbUnitOfWork {
  readonly client: QueryClient;

  constructor(private readonly pgClient: PoolClient) {
    this.client = asQueryClient(pgClient);
  }

  async commit(): Promise<void> {
    await this.pgClient.query('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.pgClient.query('ROLLBACK');
  }
}

/**
 * Factory that runs work inside a single PostgreSQL transaction.
 * Orchestrator uses this for envelope `phase: db` steps (Phase 2+).
 */
export class PgUnitOfWorkFactory implements DbUnitOfWorkFactory {
  constructor(private readonly pool: Pool) {}

  async runInTransaction<T>(work: (unitOfWork: DbUnitOfWork) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const unitOfWork = new PgUnitOfWork(client);
      try {
        const result = await work(unitOfWork);
        await unitOfWork.commit();
        return result;
      } catch (error) {
        await unitOfWork.rollback();
        throw error;
      }
    } finally {
      client.release();
    }
  }
}
