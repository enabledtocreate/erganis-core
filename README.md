# Erganis Core

Single repo for the **Core** layer of Erganis Platform: contracts, data, infrastructure, services, packages, and scripts.

## Structure

| Folder | Purpose |
|--------|---------|
| **contracts/** | Schemas, SDK generation in `contracts/sdk/` (TypeScript first; `dotnet/` reserved) |
| **data/** | DAL, migrations, SQL |
| **infrastructure/** | Runtime & deploy; Docker optional |
| **services/** | NestJS Core runtime, orchestrator, pg-boss |
| **packages/** | Hand-maintained shared libraries (`typescript/` now; `dotnet/` reserved) |
| **tools/** | Contract readers, codegen, module connection generators |
| **scripts/** | Setup, deploy, dev, migrate, update |

Use **relative paths** between these folders.

## Quick start

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres   # optional
./scripts/dev/setup-local.sh   # or setup-local.ps1 on Windows
cd services && cp .env.example .env && npm run start:dev
```

**Core C0–C12 complete** — **C13–C16 planned.** See [`docs/temp/CORE-IMPLEMENTATION-PLAN.md`](docs/temp/CORE-IMPLEMENTATION-PLAN.md), [`CORE-ARCHITECTURE.md`](docs/temp/CORE-ARCHITECTURE.md), and [`ui/docs/UI-ARCHITECTURE.md`](../ui/docs/UI-ARCHITECTURE.md).

## Apps

Studio, Agora, and Companion live in **separate repos**. They consume the **API** (URL or generated SDK from `contracts/sdk/`).

## GitHub

**Owner:** [enabledtocreate](https://github.com/enabledtocreate)  
**Repo:** `erganis-core`
