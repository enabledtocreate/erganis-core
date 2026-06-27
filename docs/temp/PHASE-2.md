# Phase 2 — Module Loader + DAL + Envelope Smoke

> **Status:** Complete (Jun 2025).  
> **Depends on:** [Phase 1](./PHASE-1.md) auth.

Phase 2 validates module loading, the shared data-access layer, and the orchestrator transaction library with a hello-world stub module.

## Deliverables

| Unit | Location | Status |
|------|----------|--------|
| DAL interfaces + `BaseRepository` | `packages/typescript/src/dal/` | Done (Phase 1 commit) |
| PostgreSQL DAL adapters | `data/dal/` (`@erganis/dal-postgres`) | Done (Phase 1 commit) |
| Orchestration types | `packages/typescript/src/orchestration/` | Done |
| Module manifest types | `packages/typescript/src/modules/` | Done |
| Platform module registry SQL | `data/migrations/002_platform_modules.sql` | Done |
| Module loader | `services/src/modules/loader/` | Done |
| Orchestrator + HTTP API | `services/src/modules/orchestrator/` | Done |
| Hello-world stub module | `studio/modules/hello-world/` | Done |
| Authenticated envelope e2e | `services/test/operations.e2e-spec.ts` | Done |
| Module migration policy documented | Product plan §12, PHASE-2 | Done |
| Migration SQL validation | `ModuleMigrationService` | Core **C4** |

## Architecture (summary)

1. **Discovery** — `ModuleDiscoveryService` scans `MODULES_ROOT` for `erganis.module.json`.
2. **Migrations** — Platform SQL runs on `OnModuleInit`; module SQL runs per manifest after platform tables exist.
3. **Load** — `ModuleLoaderService` runs on `OnApplicationBootstrap` (after platform migrations), applies module migrations, registers handlers via `createRequire`.
4. **Execute** — `POST /operations/execute` (session required) resolves steps from manifests, runs `phase: db` handlers inside `PgUnitOfWorkFactory.runInTransaction`.

## Module migration policy (product decision)

Aligned with [§12 Module migrations](../../../docs/erganis-product-plan.md#module-migrations-decided) in the product plan.

| Rule | Detail |
|------|--------|
| **Core-owned execution** | Only `ModuleMigrationService` applies module SQL — modules never run DDL themselves |
| **First-party modules** | Single `migrations/` folder per module (`studio/modules/*`, `agora/modules/*`) |
| **Third-party modules** | **Mandatory** `migrations/` folder under `studio/modules/third-party/` — Core rejects enable if missing |
| **Third-party DDL scope** | Own schema only — **forbidden** to modify `platform.*` or any first-party module schema |
| **Phase 2 (implemented)** | Manifest-listed files applied in version order; tracked in `platform.module_migrations` |
| **Phase 3+ (planned)** | Core SQL validation before execute; third-party folder check; schema allowlist |

## Hello-world stub

- **Manifest:** `studio/modules/hello-world/erganis.module.json`
- **Surface / action:** `stub.save`
- **Handler:** `pingSave` — inserts into `hello_world.greetings` using `BaseRepository` + orchestrator unit of work

Build before running Core with modules:

```bash
cd studio/modules/hello-world
npm install && npm run build
```

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Required for loader, orchestrator, e2e |
| `MODULES_ROOT` | Path to `studio/modules` (default from services cwd) |
| `RUN_MIGRATIONS_ON_START` | Apply platform SQL on startup (default `true`) |
| `AUTH_LOCAL_ENABLED` | Required for envelope e2e local login |

## Test plan

- Platform: `packages/typescript` — orchestration + DAL specs
- Services unit: loader discovery, orchestrator service
- E2e: `operations.e2e-spec.ts` — login + envelope smoke; `global-setup.js` builds hello-world when `DATABASE_URL` is set
- CI: build platform → hello-world → services → `npm test` + `npm run test:e2e` (single worker)

## References

- Product plan P38 Phase 2 (3C)
- [`CORE-ARCHITECTURE.md`](./CORE-ARCHITECTURE.md) — Core architecture (Phases 0–2)
- [`data/dal/README.md`](../../data/dal/README.md) — repository extension guide
