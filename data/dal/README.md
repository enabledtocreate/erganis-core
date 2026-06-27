# @erganis/dal-postgres

PostgreSQL adapters for Erganis data access. **Interfaces and `BaseRepository` live in `@erganis/platform`** (no `pg` dependency); this package connects them to `node-pg`.

## For module authors

1. Create a repository class extending `BaseRepository` from `@erganis/platform`.
2. Accept `QueryClient` in the constructor (works with pool **or** transaction scope).
3. Use `qualifiedTable('your_module_schema', 'table')` for SQL — one schema per module.
4. Inside envelope handlers (Phase 2+), use repos constructed with `unitOfWork.client`, not the pool.

### Example

```typescript
import { BaseRepository } from '@erganis/platform';
import type { QueryClient } from '@erganis/platform';

export class WidgetRepository extends BaseRepository {
  static readonly SCHEMA = 'inventory';

  constructor(client: QueryClient) {
    super(client);
  }

  findByPublicId(publicId: string) {
    const table = this.qualifiedTable(WidgetRepository.SCHEMA, 'widgets');
    return this.queryOne(
      `SELECT id, public_id, name FROM ${table} WHERE public_id = $1`,
      [publicId],
      (row) => ({
        id: row.id as string,
        publicId: row.public_id as string,
        name: row.name as string,
      }),
    );
  }
}
```

### NestJS wiring (Core or module runtime)

```typescript
import { createPoolRepository } from '@erganis/dal-postgres';

{
  provide: WidgetRepository,
  useFactory: (db: DatabaseService) =>
    createPoolRepository(WidgetRepository, db.getPool()),
  inject: [DatabaseService],
}
```

### Transactions (orchestrator)

```typescript
import { PgUnitOfWorkFactory } from '@erganis/dal-postgres';

await unitOfWorkFactory.runInTransaction(async (uow) => {
  const widgets = new WidgetRepository(uow.client);
  await widgets.create(...);
});
```

## Exports

| Export | Purpose |
|--------|---------|
| `asQueryClient` | Wrap `Pool` or `PoolClient` as `QueryClient` |
| `PgRepository` | Shorthand: `extends BaseRepository` + pool constructor |
| `createPoolRepository` | Nest factory helper |
| `PgUnitOfWorkFactory` | Transaction scope for envelope `phase: db` steps |

## Tests

```bash
cd core/data/dal && npm ci && npm test
```
