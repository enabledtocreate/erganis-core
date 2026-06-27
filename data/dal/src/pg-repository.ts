import { BaseRepository, QueryClient } from '@erganis/platform';
import { Pool } from 'pg';
import { asQueryClient } from './pg-query-client';

/**
 * Convenience base for repositories constructed from a pg Pool (default services wiring).
 * Module repos can extend {@link BaseRepository} directly and accept {@link QueryClient}
 * from a pool or from {@link DbUnitOfWork.client} inside a transaction.
 */
export abstract class PgRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(asQueryClient(pool));
  }
}

/**
 * NestJS factory for repositories whose constructor accepts a pg Pool
 * (typically subclasses of {@link PgRepository}).
 */
export function createPoolRepository<T>(
  RepoClass: new (pool: Pool) => T,
  pool: Pool | null,
): T {
  if (!pool) {
    throw new Error('DATABASE_URL is required for repository providers');
  }
  return new RepoClass(pool);
}

/**
 * NestJS factory for repositories whose constructor accepts a {@link QueryClient}
 * (typically subclasses of {@link BaseRepository} for module code).
 */
export function createClientRepository<T extends BaseRepository>(
  RepoClass: new (client: QueryClient) => T,
  pool: Pool | null,
): T {
  if (!pool) {
    throw new Error('DATABASE_URL is required for repository providers');
  }
  return new RepoClass(asQueryClient(pool));
}
