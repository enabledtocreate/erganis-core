# Contracts — Schema layout and public API generation

## Layout

- **`core/openapi.yaml`** — Single source of truth for the full API (internal). Edit only this file.
- **`public/v1/`, `public/v2/`, …** — Generated public subsets, one folder per public version. Do not edit by hand.

## Tagging (Option A)

In `core/openapi.yaml`, every path operation must have:

- **`x-audience: public`** — Included in the generated public API subset.
- **`x-audience: internal`** — Internal only; excluded from public.

Public API = core filtered to operations where `x-audience: public`.

## Generating the public subset

From the `contracts` repo root:

```bash
npm install
npm run generate-public
# Or for a specific version (e.g. v2):
node scripts/generate-public-api.js v2
```

This reads `schemas/core/openapi.yaml`, keeps only operations with `x-audience: public`, and writes to `schemas/public/<version>/openapi.yaml`. Existing `public/v1/` (etc.) are not overwritten unless you run the generator for that version.

## Releasing a new public version

1. Update `core/openapi.yaml` (add/change public operations as needed).
2. Run `node scripts/generate-public-api.js v2` (use the next version number).
3. Commit `schemas/public/v2/openapi.yaml`.
4. Serve both `/v1/` and `/v2/` at the API gateway during the support window.
5. After the support period, sunset v1 (stop serving it); keep `public/v1/` in repo for history.

## Support policy (previous version)

- When a new public version (e.g. v2) is released, the **previous** version (v1) remains supported for a defined period (e.g. 6 months).
- During that time, both `/v1/` and `/v2/` are available; consumers can migrate.
- After the support period, only the latest public version is supported; older public specs remain in the repo for reference only.
