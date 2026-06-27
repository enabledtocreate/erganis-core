# Core C11 — Sync API (stub)

> **Status:** Complete (in-memory stub).  
> **Depends on:** [C10](./PHASE-C10.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `SyncController` | `sync/sync.controller.ts` | Pull/push entity changes for offline-capable clients |
| `SyncModule` | Wired into `AppModule` | Session-authenticated sync routes |

## Endpoints

### Pull

```http
GET /sync/pull?orgSlug=acme&sinceVersion=0
Cookie: erganis_session=…
```

Returns `{ orgSlug, records: [{ entityPublicId, entityVersion, payload }] }` for entities with version **greater than** `sinceVersion`.

### Push

```http
POST /sync/push
Cookie: erganis_session=…

{
  "orgSlug": "acme",
  "changes": [
    { "entityPublicId": "doc_1", "entityVersion": 3, "payload": { "title": "Draft" } }
  ]
}
```

- Accepts change when stored version matches `entityVersion` (optimistic concurrency).
- Bumps stored version by 1 on success.
- **409 Conflict** with `{ code: 'SYNC_CONFLICT', entityPublicIds: [...] }` on version mismatch.

## Implementation note

C11 uses an **in-memory** store for contract smoke tests. Production sync will tie into entity locks / versions (C3) and module persistence in a later phase.

## References

- Product plan C11
- Entity locks: [PHASE-C3](./PHASE-C3.md)
