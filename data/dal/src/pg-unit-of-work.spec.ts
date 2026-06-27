import { Pool, PoolClient } from 'pg';
import { PgUnitOfWorkFactory } from './pg-unit-of-work';

describe('PgUnitOfWorkFactory', () => {
  const pgClient = {
    query: jest.fn(),
    release: jest.fn(),
  } as unknown as PoolClient;

  const pool = {
    connect: jest.fn().mockResolvedValue(pgClient),
  } as unknown as Pool;

  const factory = new PgUnitOfWorkFactory(pool);

  beforeEach(() => {
    jest.clearAllMocks();
    (pgClient.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [{ ok: true }], rowCount: 1 };
    });
  });

  it('commits on success', async () => {
    const result = await factory.runInTransaction(async (uow) => {
      await uow.client.query('INSERT INTO test VALUES (1)');
      return 'done';
    });

    expect(result).toBe('done');
    expect(pgClient.query).toHaveBeenCalledWith('BEGIN');
    expect(pgClient.query).toHaveBeenCalledWith('COMMIT');
    expect(pgClient.release).toHaveBeenCalled();
  });

  it('rolls back on failure', async () => {
    await expect(
      factory.runInTransaction(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(pgClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(pgClient.release).toHaveBeenCalled();
  });
});
