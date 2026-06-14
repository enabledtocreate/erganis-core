# Module manifest

Erganis modules are described by **`erganis.module.yaml`** (authoring) compiled to **`erganis.module.json`** (runtime).

## Workflow

1. Author edits `erganis.module.yaml` in a module folder (e.g. `studio/modules/inventory/`).
2. CI or local dev runs `npm run compile-manifest` in `core/contracts/`.
3. Core module loader reads `erganis.module.json` at startup.

## Files

| File | Purpose |
|------|---------|
| [erganis.module.schema.json](./erganis.module.schema.json) | JSON Schema (validates compiled JSON) |
| [erganis.module.example.yaml](./erganis.module.example.yaml) | Example authoring file |
| [../../scripts/compile-module-manifest.js](../scripts/compile-module-manifest.js) | YAML → JSON compiler |

## Compile command

From `core/contracts/`:

```bash
npm run compile-manifest -- path/to/erganis.module.yaml
# Writes erganis.module.json alongside the yaml (or --out path)
```

## Why YAML → JSON

YAML is easier for module authors (comments, less punctuation). Runtime uses JSON for fast parsing without a YAML dependency in production — same pattern as Kubernetes, GitHub Actions, and many CI pipelines.
