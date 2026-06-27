# Phase 0 — Core shell (complete)

**Status:** Complete (2025-06-26)  
**Repo:** `erganis-core` · **Branch:** `main`

## Delivered

| Item | Location |
|------|----------|
| NestJS app bootstrap | `services/src/main.ts`, `app.module.ts` |
| Config (`@nestjs/config`) | `services/src/config/configuration.ts` |
| Health module | `GET /health`, `GET /health/ready` |
| PostgreSQL connectivity | `DatabaseModule` + `pg` pool (`DATABASE_URL`) |
| Shared types package | `@erganis/platform` in `packages/typescript/` |
| Jest unit + e2e tests | `services/src/**/*.spec.ts`, `services/test/` |
| CI with Postgres service | Parent `.github/workflows/ci.yml` job `core` |

## Run locally

From **core repo root**:

```powershell
# Optional: start Postgres
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres

# Setup (from core root)
.\scripts\dev\setup-local.ps1

# Run API
cd services
copy .env.example .env
npm run start:dev
```

- `GET http://localhost:5000/health` — liveness
- `GET http://localhost:5000/health/ready` — readiness (+ DB ping when `DATABASE_URL` set)

## Next: Phase 1

OIDC + local fallback auth, session/JWT, org context, admin + custom roles — see product plan §6 and §22 P36.

## OpenAPI alignment

Contract stub: `contracts/schemas/core/openapi.yaml` includes `/health`. Implementation matches Phase 0 scope; composer and Surface routes land in later phases.
