# Services tests

Unit and in-repo integration tests for services (api-gateway, business-logic, background-jobs).

- **Unit tests** — Per service, with mocks for DAL and external calls.
- **Integration tests** — Service + real or test DB (in this repo only).

Use the stack’s standard tool (e.g. xUnit/NUnit for .NET, Jest/Vitest for Node).  
Cross-repo integration tests live in the **parent** repo: `erganis/tests/integration/`.

See [docs/TESTING.md](../../docs/TESTING.md) in the parent repo.
