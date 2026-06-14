# Erganis Packages

**Shared tools** — reusable libraries and utilities used across layers.

## Structure

- `ui/` — UI component libraries (React, Vue, etc.)
- `logging/` — Logging utilities and abstractions
- `auth/` — Authentication/authorization helpers
- `utils/` — General utilities
- `dotnet/` — .NET shared libraries
- `typescript/` — TypeScript/JavaScript shared libraries

## Purpose

Code shared across **app repos** (e.g. erganis-studio), **services**, and **infrastructure**:
- UI components used by multiple apps
- Logging libraries used by services
- Authentication helpers used everywhere
- Utility functions

## Publishing

Packages are published as:
- npm packages (for TypeScript/JavaScript)
- NuGet packages (for .NET)
- Other package managers as needed

## GitHub

**Owner:** [enabledtocreate](https://github.com/enabledtocreate)  
**Repo:** `erganis-packages`
