# Erganis Packages

Hand-maintained **shared libraries** for Core, module authors, and integrators. **Not** generated API clients — those live in [`../contracts/sdk/`](../contracts/sdk/).

## Layout (by language)

| Folder | Status | Purpose |
|--------|--------|---------|
| **`typescript/`** | Active (Phase 0+) | TS libs used by `services/`, `tools/`, and npm consumers — envelope helpers, `DbUnitOfWork`, platform errors, DAL interfaces |
| **`dotnet/`** | **Reserved** | Future NuGet libs (`Erganis.Platform`, etc.) — hand-authored helpers that complement generated C# clients |

## Rules

- **Contracts stay in `contracts/`** — OpenAPI and JSON Schema are the source of truth.
- **Do not hand-write HTTP clients here** — generate into `contracts/sdk/{typescript,dotnet}/`.
- **No Nest runtime in pure packages** — framework wiring stays in `services/`.
- **Core server runtime stays TypeScript** — .NET integrates via HTTP clients and optional sidecar modules, not inside Nest.

## Publishing (when implemented)

| Ecosystem | Registry | Typical packages |
|-----------|----------|------------------|
| TypeScript | npm (`@erganis/*`) | Platform helpers from `typescript/` |
| .NET | NuGet (`Erganis.*`) | Platform helpers from `dotnet/` (future) |

SDK and platform package versions should track Core releases.

## GitHub

**Owner:** [enabledtocreate](https://github.com/enabledtocreate)  
**Repo:** `erganis-core` (this folder lives in Core — not a separate packages repo)
