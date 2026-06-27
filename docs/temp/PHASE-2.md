# Phase 2 — Module Loader + DAL + Envelope Smoke

> **Status:** Planned (next after Phase 1).  
> **Depends on:** Phase 1 auth complete.

Phase 2 validates module loading, the shared data-access layer, and the orchestrator transaction library with a hello-world stub module.

## Scope

| Unit | Location | Purpose |
|------|----------|---------|
| **DAL interfaces + BaseRepository** | `packages/typescript/src/dal/` | `QueryClient`, `BaseRepository`, `DbUnitOfWork` — no `pg`, no Nest |
| **PostgreSQL DAL adapters** | `data/dal/` (`@erganis/dal-postgres`) | `asQueryClient`, `PgRepository`, `PgUnitOfWorkFactory`, Nest factories |
| Module loader | `core/services/` (TBD) | Load manifest from `studio/modules/` |
| Hello-world stub module | `studio/modules/` (TBD) | Minimal module proving loader + schema |
| Orchestrator + envelope smoke | `core/services/` (TBD) | Authenticated `phase: db` step under `DbUnitOfWork` |
| Auth repos (refactored) | `auth/infrastructure/*.repository.ts` | Extend `PgRepository` — reference pattern for module authors |

## DAL (delivered early — Phase 2 foundation)

Third-party and first-party module authors **extend `BaseRepository`** from `@erganis/platform` and wire Postgres via `@erganis/dal-postgres`. Core owns:

- Query helpers (`queryOne`, `queryMany`, `execute`)
- Schema-qualified table names (`qualifiedTable`)
- Transaction scope (`PgUnitOfWorkFactory`) for envelope steps

See [`data/dal/README.md`](../../data/dal/README.md) for module author examples.

## Still to build in Phase 2

- [ ] Module manifest compile + enable/disable
- [ ] Module migration runner (per-module schema)
- [ ] Orchestrator shell + `OperationContext` injection
- [ ] Hello-world stub handler using `BaseRepository` inside `DbUnitOfWork`
- [ ] Authenticated envelope smoke e2e test
- [ ] Unit tests for loader + orchestrator

## Test plan

- DAL: `packages/typescript` (`dal/*.spec.ts`) + `data/dal` (`*.spec.ts`)
- Loader/orchestrator: unit + e2e when implemented
- CI: build `@erganis/platform` → `@erganis/dal-postgres` → services

## References

- Product plan P38 Phase 2 (3C): module loader + stub envelope smoke
- [`AUTH-ARCHITECTURE.md`](./AUTH-ARCHITECTURE.md) — auth layer (Phase 1)
- [`data/dal/README.md`](../../data/dal/README.md) — repository extension guide
