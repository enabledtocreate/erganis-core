import { QueryClient } from './query-client';

/**
 * A single database transaction scope. Repositories created inside a unit of work
 * must use {@link DbUnitOfWork.client} so all writes share one transaction.
 */
export interface DbUnitOfWork {
  readonly client: QueryClient;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Opens and commits/rolls back transactions. Used by the orchestrator (Phase 2+)
 * so module handlers never call BEGIN/COMMIT directly.
 */
export interface DbUnitOfWorkFactory {
  runInTransaction<T>(work: (unitOfWork: DbUnitOfWork) => Promise<T>): Promise<T>;
}
