# Generated SDKs

API clients and models **generated from** `contracts/schemas/` (OpenAPI-first). Hand-written SDKs do not live in app repos.

## Layout

| Folder | Status | Output |
|--------|--------|--------|
| **`typescript/`** | First (Phase 0–1) | npm packages for Studio, Companion, module authors |
| **`dotnet/`** | **Reserved** | NuGet clients (e.g. `Erganis.Core.Client`) — no codegen until needed |
| **`java/`** | **Reserved** | Future; same contract source |

## Generation

Orchestrated from [`../`](../) schemas via [`../../tools/`](../../tools/) (OpenAPI Generator or equivalent). One Core release version drives all ecosystem SDK versions.

## Rules

- Regenerate when OpenAPI or Public API subset changes — do not edit generated files by hand.
- Composed org API (enabled modules) may produce merged specs before codegen; see product plan §14.
