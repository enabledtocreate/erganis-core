# UI composition schemas (JSON Schema)

**OpenAPI describes HTTP.** These JSON Schemas describe **UI structure** — the OpenAPI-equivalent contract layer for layout, slots, theme, and surface view-models.

Module developers control UI layout by shipping **declarative layout documents** validated against these schemas. Core and `erganis-ui` consume the same definitions; React/Shadcn is one implementation, not the contract.

## Schema map

| Schema | Purpose | Author |
|--------|---------|--------|
| [ui-layout.schema.json](./ui-layout.schema.json) | Surface/page layout — regions, slot placements, component refs | Module teams |
| [theme.schema.json](./theme.schema.json) | Design tokens + component skins (aligns with Core C12) | Core defaults; org overrides |
| [slot-registry.schema.json](./slot-registry.schema.json) | Platform slot ids and metadata | Core (C10) |

## Module developer workflow

1. Declare **components** in manifest `contributions.ui` (`slot` + `component` path).
2. Declare **layout** in manifest `contributions.layout` (path to a layout JSON file).
3. Author `*.layout.json` per surface — validated against `ui-layout.schema.json`.
4. Optional: per-surface **view-model** JSON Schema under module `contracts/ui/` (typed Surface load shape for UI bindings).
5. At build time: `npm run validate-ui` in `core/contracts/` (C15/C16) validates layout files.

## Layout vs component

| Mechanism | Controls |
|-----------|----------|
| **`contributions.ui`** | *Which component* mounts in *which platform slot* (nav, widget) |
| **`contributions.layout`** | *How a surface page* arranges regions — grid, tabs, panels, bindings to Surface load steps |
| **React component code** | Pixel behavior inside a region — must accept props from `@erganis/ui-react` |

## Relationship to OpenAPI

| Layer | Format | Example |
|-------|--------|---------|
| HTTP API | OpenAPI 3.x | `GET /surfaces/{id}/load` |
| Mutation | JSON Schema envelope | `operation-envelope.schema.json` |
| UI layout | JSON Schema (this folder) | `product.layout.json` |
| Module manifest | JSON Schema | `erganis.module.schema.json` |

Generated TypeScript types for layout documents live in `@erganis/ui-contracts` (erganis-ui, C16). OpenAPI SDK covers HTTP; layout types come from JSON Schema codegen (`json-schema-to-typescript` or similar).

## Field-level UI (future)

For dynamic forms (settings, metadata editors), modules may add **UI Schema** fragments (JSON Forms / RJSF-style `ui:order`, `ui:widget`) alongside JSON Schema for data — separate from page layout. Not required for v1 surface layouts.

## References

- [UI-ARCHITECTURE.md](../../../../ui/docs/UI-ARCHITECTURE.md)
- [CORE-IMPLEMENTATION-PLAN.md §C16](../../../docs/temp/CORE-IMPLEMENTATION-PLAN.md#c16--ui-composition-erganis-ui-coordination)
- Module manifest: [../module/erganis.module.schema.json](../module/erganis.module.schema.json)
