# Erganis Core

Single repo for the **Core** layer of Erganis Platform: contracts, data, infrastructure, services, packages, and scripts.

## Structure

| Folder | Purpose |
|--------|---------|
| **contracts/** | Schemas, SDK generation (`sdk/`), core + public API |
| **data/** | DAL, migrations, SQL |
| **infrastructure/** | Runtime & deploy; Docker optional |
| **services/** | NestJS Core runtime, orchestrator, pg-boss |
| **packages/** | Shared libraries |
| **scripts/** | Setup, deploy, dev, migrate, update |

Use **relative paths** between these folders.

## Apps

Studio, Agora, and Companion live in **separate repos**. They consume the **API** (URL or generated SDK from `contracts/sdk/`).

## GitHub

**Owner:** [enabledtocreate](https://github.com/enabledtocreate)  
**Repo:** `erganis-core`
