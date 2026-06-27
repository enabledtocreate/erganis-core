/** A single row returned from the database (snake_case column names). */
export type QueryResultRow = Record<string, unknown>;

export interface QueryResult {
  rows: QueryResultRow[];
  rowCount: number | null;
}

/**
 * Minimal database client contract — implemented by pg Pool/PoolClient via adapter.
 * Module repositories depend on this interface, not on `pg` directly.
 */
export interface QueryClient {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
}
