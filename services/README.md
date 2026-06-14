# Erganis Core Services

**NestJS application tier** — Core runtime, orchestrator, API gateway, background jobs.

See [SCAFFOLD.md](./SCAFFOLD.md) and [docs/STACK.md](../../docs/STACK.md).

## Structure

- `api-gateway/` — HTTP routing (Surface + Public APIs)
- `business-logic/` — Domain services loaded via module manifest
- `background-jobs/` — pg-boss workers
- `shared/` — Middleware, utilities

## Technology

**NestJS** + TypeScript + PostgreSQL + pg-boss.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Core PostgreSQL connection string |
| `ERGANIS_DATA_ROOT` | Yes (v1 files) | Local file storage root |
| `API_PORT` | No | Default 5000 |
| `LOG_LEVEL` | No | info \| debug \| warn \| error |
| `NODE_ENV` | No | development \| production |

Redis is **not required** for v1 (pg-boss uses PostgreSQL).

## Related

- **core/contracts** — API schemas and SDKs
- **core/data** — DAL, migrations
- **core/packages** — Shared libraries

## GitHub

Part of **erganis-core**. Path: `core/services/`
