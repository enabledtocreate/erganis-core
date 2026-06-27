import { QueryClient, QueryResult, QueryResultRow } from './query-client';

export type RowMapper<T> = (row: QueryResultRow) => T;

/**
 * Base class for Erganis repositories. Subclasses implement domain queries;
 * Core provides query helpers and schema-qualified table names.
 *
 * Module authors: extend this class, pass a {@link QueryClient} from
 * {@link @erganis/dal-postgres} (pool or unit-of-work client).
 */
export abstract class BaseRepository {
  constructor(protected readonly client: QueryClient) {}

  /** Run a query and return the raw result. */
  protected async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    return this.client.query(sql, params);
  }

  /** Return mapped row or null when no rows. */
  protected async queryOne<T>(
    sql: string,
    params: unknown[],
    map: RowMapper<T>,
  ): Promise<T | null> {
    const result = await this.query(sql, params);
    if (!result.rowCount) {
      return null;
    }
    return map(result.rows[0]);
  }

  /** Return all mapped rows (empty array when none). */
  protected async queryMany<T>(
    sql: string,
    params: unknown[],
    map: RowMapper<T>,
  ): Promise<T[]> {
    const result = await this.query(sql, params);
    return result.rows.map(map);
  }

  /** Execute a statement that does not return rows (INSERT/UPDATE/DELETE). */
  protected async execute(sql: string, params: unknown[] = []): Promise<number> {
    const result = await this.query(sql, params);
    return result.rowCount ?? 0;
  }

  /** Build `schema.table` for module-scoped SQL. */
  protected qualifiedTable(schema: string, table: string): string {
    if (!/^[a-z][a-z0-9_]*$/.test(schema) || !/^[a-z][a-z0-9_]*$/.test(table)) {
      throw new Error(`Invalid schema or table name: ${schema}.${table}`);
    }
    return `${schema}.${table}`;
  }
}
