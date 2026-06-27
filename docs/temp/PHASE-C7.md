# Core C7 — Surface API

> **Status:** Complete.  
> **Depends on:** [C6](./PHASE-C6.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `SurfaceLoadService` | `surface/surface-load.service.ts` | Aggregates module `load` handlers for a surface |
| `SurfaceController` | `GET /surfaces/:surfaceId/load?orgSlug=` | Session-authenticated surface load |
| `SurfaceModule` | Wired into `AppModule` | Imports `LoaderModule` + `AuthModule` |

## Behavior

1. Resolve org by slug; **404** if missing.
2. `ModuleAccessService.assertOperationAllowed(orgId, surfaceId, 'load')` — same enable/disable rules as operations.
3. For each enabled module, run handlers registered for `{ surfaceId, action: 'load' }`.
4. Response shape: `{ surfaceId, orgSlug, modules: { [moduleId]: { [stepId]: stepResult } } }`.

Load handlers receive a no-op unit-of-work (read-only aggregation path).

## HTTP example

```http
GET /surfaces/dashboard/load?orgSlug=acme
Cookie: erganis_session=…
```

```json
{
  "surfaceId": "dashboard",
  "orgSlug": "acme",
  "modules": {
    "erganis.hello-world": {
      "hello-load": { "title": "Hello" }
    }
  }
}
```

## Module manifest

Register a load step in `operations`:

```json
{
  "surfaceId": "dashboard",
  "action": "load",
  "stepId": "hello-load",
  "handler": "pingLoad",
  "failureClass": "optional",
  "phase": "read"
}
```

## References

- Product plan C7
- `CORE-ARCHITECTURE.md` §11 — Surface load flow
