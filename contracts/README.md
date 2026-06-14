# Erganis Contracts

**Schemas and auto-generated SDKs** — source of truth for API contracts, module manifests, and generated client libraries.

## Purpose

- **Core API** — `schemas/core/openapi.yaml` (internal API)
- **Public API** — Generated subset (`x-audience: public`) in `schemas/public/v1/`, etc.
- **Module manifests** — `schemas/module/`; YAML → JSON via `compile-module-manifest.js`
- **SDKs** — Auto-generated in `sdk/` (TypeScript, etc.)

Apps (Studio, Agora, Companion) consume the API via live URL or generated SDK — not by referencing Core source directly.

## Structure

- `schemas/core/` — Core API spec
- `schemas/public/v1/` — Generated public API (do not edit by hand)
- `schemas/module/` — Module manifest schema and examples
- `sdk/` — Generated SDKs
- `scripts/generate-public-api.js` — Public API subset generator
- `scripts/compile-module-manifest.js` — Module YAML → JSON

## Commands

```bash
npm install
npm run generate-public
npm run compile-manifest -- path/to/erganis.module.yaml
```

## GitHub

Part of **erganis-core**. **Owner:** [enabledtocreate](https://github.com/enabledtocreate)  
**Path:** `core/contracts/`
