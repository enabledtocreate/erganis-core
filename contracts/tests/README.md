# Contracts tests

Unit and in-repo integration tests for the contracts repo.

- **Schema validation** — OpenAPI lint, schema consistency.
- **Generator smoke test** — Run `generate-public-api.js` and assert public subset contains only `x-audience: public` operations.
- **SDK generation** — When SDKs exist, smoke test that they build.

See [docs/TESTING.md](../../docs/TESTING.md) in the parent repo for the full testing strategy.
