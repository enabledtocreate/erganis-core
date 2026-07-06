# Erganis Contracts

**Schemas and generated SDKs** — platform contract source of truth, module manifest schema, and SDK output paths.

## Who owns what

| Layer | Authored by | Managed by Core | Location |
|-------|-------------|-----------------|----------|
| **Platform contracts** | Core team | Validate & enforce | `schemas/core/`, envelope/Surface schemas (Phase 0+) |
| **Module manifest schema** | Core team | Validate on load | `schemas/module/` |
| **Module domain contracts** | Product/module teams | Register, merge, validate at boundaries | Module repos — e.g. `studio/modules/inventory/openapi/` referenced from manifest `openApiFragment` |
| **Generated SDKs** | Codegen from OpenAPI | Publish/version with Core | `sdk/typescript/` (first); `sdk/dotnet/` reserved |

**Rule:** Modules **develop** domain API fragments and step I/O; Core **manages** the registry, composer, orchestrator boundaries, and platform invariants. Hand-written HTTP clients do not live in app repos.

## Structure

- `schemas/core/openapi.yaml` — Core Surface API (single source of truth)
- `schemas/public/v1/` — Generated public subset (`x-audience: public` only — do not edit by hand)
- `schemas/module/` — Module manifest JSON Schema, examples, YAML → JSON compile
- `schemas/composition/` — **UI layout JSON Schema** (OpenAPI-equivalent for UI structure) — [README](./schemas/composition/README.md)
- `schemas/envelope/` — Operation envelope JSON Schema
- `sdk/typescript/` — Generated TypeScript clients (Phase 0–1)
- `sdk/dotnet/` — **Reserved** — generated NuGet clients (future)
- `scripts/generate-public-api.js` — Public API subset generator
- `scripts/compile-module-manifest.js` — Module YAML → JSON

## Commands

```bash
npm install
npm run generate-public
npm run compile-manifest -- path/to/erganis.module.yaml
```

## SDK generation

| Target | Path | Status |
|--------|------|--------|
| TypeScript | `sdk/typescript/` | First — Phase 0–1 |
| .NET | `sdk/dotnet/` | Reserved — no codegen until needed |
| Java | `sdk/java/` | Reserved — future |

Codegen orchestrated from [`../tools/`](../tools/) when implemented (Core **C15**). UI composition libraries live in **`erganis-ui`** ([`ui/docs/UI-ARCHITECTURE.md`](../../ui/docs/UI-ARCHITECTURE.md)). See [docs/erganis-product-plan.md](../../docs/erganis-product-plan.md) §6 Contracts & SDKs.

Module **migrations** in manifest extend the database when modules are enabled — separate from OpenAPI but validated via the same manifest schema.

Part of **erganis-core**. **Owner:** [enabledtocreate](https://github.com/enabledtocreate)  
**Path:** `core/contracts/`
