# Erganis Core — Contracts Catalog (C15)

> Exhaustive reference for platform JSON Schema contracts, manifest contributions, and HTTP endpoints agents/tools consume.

## Envelope

| Schema | Path | Purpose |
|--------|------|---------|
| Operation envelope | `schemas/envelope/operation-envelope.schema.json` | `POST /operations/execute` body |

## Module manifest

| Schema | Path | Purpose |
|--------|------|---------|
| Module manifest | `schemas/module/erganis.module.schema.json` | `erganis.module.json` in each module |

**Contribution types:** `operations`, `jobs`, `events`, `ui`, `layout`, `migrations`.

## UI composition (C16)

| Schema | Path | Purpose |
|--------|------|---------|
| Surface layout | `schemas/composition/ui-layout.schema.json` | `*.layout.json` per surface |
| Theme | `schemas/composition/theme.schema.json` | Resolved theme from `GET /composition/theme` |
| Slot registry | `schemas/composition/slot-registry.schema.json` | Platform slot definitions |

**Runtime:** `GET /composition/schemas` returns embedded JSON Schema documents.

## Agent discovery (C13)

| Endpoint | Purpose |
|----------|---------|
| `GET /agent/capabilities?orgSlug=` | Surfaces, actions, operations, layout paths, schema refs |

**Structured errors:** All HTTP errors include `{ error: { code, message, field?, recoverable } }`.

## Workflows (C14)

| Endpoint | Purpose |
|----------|---------|
| `GET /workflows/definitions?orgSlug=` | Platform + org workflow definitions |
| `GET /workflows/definitions/:workflowKey` | Single definition |
| `POST /workflows/instances` | Start pipeline at first titled node |
| `GET /workflows/instances/:id` | Instance + node audit log |
| `POST /workflows/instances/:id/advance` | Manual advance |

**Triggers:** Node `trigger` matches `operation.completed` payload (`surfaceId.action` or exact string).

## Validation CLI (`core/tools/`)

```bash
node core/tools/validate-manifest.mjs studio/modules/hello-world/erganis.module.json
node core/tools/validate-layout.mjs path/to/surface.layout.json [expectedSurfaceId]
```

## Default platform slots (C10)

| slotId | Region |
|--------|--------|
| `shell.header` | header |
| `shell.sidebar` | sidebar |
| `shell.main` | main |
| `dashboard.widget` | dashboard |

## SDK generation (reserved)

| Path | Status |
|------|--------|
| `core/contracts/sdk/typescript/` | Reserved — OpenAPI → TS client |
| .NET / Java | Documented only; TS first |
