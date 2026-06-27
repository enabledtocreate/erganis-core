import { Pool } from 'pg';
import { asQueryClient } from './pg-query-client';

describe('asQueryClient', () => {
  it('delegates query to pg Pool', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
    } as unknown as Pool;

    const client = asQueryClient(pool);
    const result = await client.query('SELECT 1', []);

    expect(pool.query).toHaveBeenCalledWith('SELECT 1', []);
    expect(result.rowCount).toBe(1);
  });
});
