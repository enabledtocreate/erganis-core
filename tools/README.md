# Erganis Core Tools

Developer tooling — contract readers, OpenAPI → SDK codegen, module connection generators, orchestration mapping config.

## Status

**Phase 0:** folder reserved; initial codegen may live in `contracts/scripts/` until tools are split out.

## Planned responsibilities

| Tool | Purpose |
|------|---------|
| **OpenAPI codegen** | Generate `contracts/sdk/typescript/` (and later `sdk/dotnet/`) from `schemas/core/openapi.yaml` + merged module fragments |
| **Manifest tooling** | Wrappers around `contracts/scripts/compile-module-manifest.js` |
| **Mapping config** | Read/write declarative field/step mapping between module contracts (Studio + orchestrator UI) |
| **Module wiring** | Assist module authors linking public contracts and orchestration steps |

## Rules

- **Contracts stay in `contracts/`** — tools read schemas; they do not become the source of truth.
- **Node/TypeScript first** — .NET CLI only if a concrete .NET-only audience appears later.

See [docs/erganis-product-plan.md](../../docs/erganis-product-plan.md) §6 and §12.

Part of **erganis-core**. Path: `core/tools/`
