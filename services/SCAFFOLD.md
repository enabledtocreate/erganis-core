# Core Services — NestJS scaffold

Planned NestJS application in this folder. See [docs/STACK.md](../../docs/STACK.md) for the full stack table, flowchart, and module breakdown.

## Planned modules

- `AuthModule` — identity, org RBAC
- `OrchestratorModule` — operation envelope ([ADR 001](../../docs/adr/001-operation-envelope.md))
- `ModuleLoaderModule` — load `erganis.module.json`
- `SurfaceModule` / `PublicApiModule` — HTTP APIs
- `JobModule` — pg-boss workers
- `FileModule` — LocalFileStore (`ERGANIS_DATA_ROOT`)
- `SearchModule` — PostgreSQL FTS adapter
- `CompositionModule` — org overrides, themes
- `OutboxModule` — event outbox poller

## Environment

Copy `.env.example` when added. Requires PostgreSQL (native or Docker optional).

## Jobs

Modules register job handlers in manifest. Core runs pg-boss workers — not a separate app or Studio plugin.
