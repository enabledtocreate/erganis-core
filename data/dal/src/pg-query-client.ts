import { QueryClient, QueryResult } from '@erganis/platform';
import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';

/** Adapt a pg Pool or PoolClient to the platform {@link QueryClient} interface. */
export function asQueryClient(source: Pool | PoolClient): QueryClient {
  return {
    query: async (sql: string, params?: unknown[]): Promise<QueryResult> => {
      const result: PgQueryResult = await source.query(sql, params);
      return {
        rows: result.rows as QueryResult['rows'],
        rowCount: result.rowCount,
      };
    },
  };
}

/** Create a {@link QueryClient} from a connection pool (auto-commit per query). */
export function queryClientFromPool(pool: Pool): QueryClient {
  return asQueryClient(pool);
}
