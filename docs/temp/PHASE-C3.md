# Core C3 — Orchestrator Hardening

> **Status:** Complete.  
> **Depends on:** [C2](./PHASE-2.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| Entity version + lock tables | `data/migrations/003_platform_entity_locks.sql` | Optimistic concurrency + workflow locks |
| `EntityLockService` | `orchestrator/application/` | Version check (409), lock acquire/release, bump |
| Orchestrator integration | `orchestrator.service.ts` | Locks on `save`/`draft`/`archive`/`approve` when `entityPublicId` set |
| Partial outcomes | `@erganis/platform` `computeOutcome` | Optional step failure → `partial`; advisory → `warning` |
| HTTP status | `operations.controller.ts` | `201` success, `200` partial, `422` failed, `409` lock/version conflict |
| Envelope JSON Schema | `contracts/schemas/envelope/operation-envelope.schema.json` | Contract reference |

## Behavior

- **`entityVersion`** on envelope — mismatch with stored version → **409** `VERSION_CONFLICT`.
- **`entityPublicId`** on lockable actions — exclusive lock for operation TTL (`ENTITY_LOCK_TTL_SECONDS`, default 300s). Held lock → **409** `LOCK_CONFLICT`.
- After successful execute (success or partial), version increments; response includes **`entityVersion`**.
- **`failureClass: optional`** — failure after commit does not roll back DB steps; outcome **`partial`**, HTTP **200**.
- **`failureClass: advisory`** — handler failure recorded as step **`warning`**.

## Tests

- `orchestration-utils.spec.ts` — partial/lockable actions
- `entity-lock.service.spec.ts` — version + lock conflicts
- `orchestrator.service.spec.ts` — locks, partial post_commit

## References

- [`CORE-ARCHITECTURE.md`](./CORE-ARCHITECTURE.md) §11, §12
- Product plan [§6 C3](../../../docs/erganis-product-plan.md#core-remaining-work)
