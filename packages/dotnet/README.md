# .NET packages (reserved)

**No implementation yet.** This folder is reserved for future **NuGet** libraries that complement generated C# API clients.

## When .NET work starts

| Package (planned) | Role |
|-------------------|------|
| `Erganis.Platform` | Public ID helpers, shared error types, auth utilities |
| `Erganis.Orchestration` | Optional client-side envelope builder for integrators |

Generated HTTP clients will live in [`../../contracts/sdk/dotnet/`](../../contracts/sdk/dotnet/), not here.

## Integration model (unchanged)

- Core **runtime** remains Nest/TypeScript in `services/`.
- .NET **consumers** call Surface/Public API via generated clients.
- .NET **modules** (if any) integrate via HTTP + orchestration — not loaded as Nest DynamicModules.

See [`../README.md`](../README.md) and the product plan §6 (Contracts & SDKs).
