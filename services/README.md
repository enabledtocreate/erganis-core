# Erganis Core Services

**NestJS application** — Core runtime: auth, orchestrator, module loader, Surface/Public APIs, pg-boss jobs.

See [docs/erganis-product-plan.md](../../docs/erganis-product-plan.md) §6 Core.

## Layout (Phase 0+)

Hybrid Nest structure — **platform modules** at the top level; inside each module: `controllers/`, `application/`, `domain/`, `infrastructure/`. Shared types live in [`../packages/typescript/`](../packages/typescript/).

```
services/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   └── modules/
│       ├── auth/              # AuthModule — OIDC, session, JWT, org context
│       ├── orchestrator/      # OrchestratorModule — operation envelope
│       ├── module-loader/     # ModuleLoaderModule — manifest load, migrator
│       ├── surface/           # SurfaceModule — Surface API routes
│       ├── public-api/        # PublicApiModule — Public API subset
│       ├── health/            # Health checks (Phase 0)
│       └── …                  # FileModule, JobModule, etc. as phases land
├── test/
└── package.json
```

Legacy placeholder folders (`api-gateway/`, `business-logic/`, …) were removed — they predated the kickoff Nest layout decision.

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

## Quick start (Phase 0)

```bash
# From core repo root — optional Postgres via Docker
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres

# Install deps
cd packages/typescript && npm install && npm run build
cd ../../services && npm install

# Configure
cp .env.example .env

# Dev server (port 5000)
npm run start:dev
```

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness — always `200` |
| `GET /health/ready` | Readiness — pings Postgres when `DATABASE_URL` set; `database: skipped` otherwise |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile Nest app |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | HTTP e2e tests (supertest) |
| `npm run start:dev` | Watch mode |

See [`../docs/temp/CORE-IMPLEMENTATION-PLAN.md`](../docs/temp/CORE-IMPLEMENTATION-PLAN.md) for implementation phases (C0–C11).

## Related

- **core/contracts** — API schemas and SDK generation
- **core/data** — DAL, migrations
- **core/packages/typescript** — Shared libraries (no Nest runtime in pure packages)
- **core/tools** — Codegen and contract tooling

Part of **erganis-core**. Path: `core/services/`
