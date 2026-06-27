# Core C9 — Jobs, Outbox, Operation Audit Log

> **Status:** Complete.  
> **Depends on:** [C8](./PHASE-C8.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `005_platform_operations.sql` | `data/migrations/` | `operation_log`, `outbox_events`, `job_queue` |
| `OperationLogRepository` | `platform-services/platform-repositories.ts` | Append-only operation audit rows |
| `OutboxRepository` | Same | Transactional outbox for `operation.completed` |
| `JobQueueRepository` | Same | Pending background jobs (enqueue API only in C9) |
| `PlatformEventService` | `platform-event.service.ts` | `recordOperation`, `enqueueJob` |
| Orchestrator hook | `orchestrator.service.ts` | Calls `recordOperation` after successful execute |

## Tables

- **`platform.operation_log`** — one row per completed orchestrator run (operation id, org, surface, action, outcome, user).
- **`platform.outbox_events`** — `{ event_type, payload, published }` for downstream publishers.
- **`platform.job_queue`** — `{ job_type, payload, status }` for async workers (worker processing is future work).

## After execute

When the orchestrator returns a result, `PlatformEventService.recordOperation`:

1. Inserts into `operation_log`.
2. Enqueues outbox event `operation.completed` with `{ operationId, outcome, surfaceId, action }`.

## References

- Product plan C9
- `CORE-ARCHITECTURE.md` — platform event pipeline
