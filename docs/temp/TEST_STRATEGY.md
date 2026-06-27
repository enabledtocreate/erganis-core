# Test Strategy (draft — pre-APM)

> **Temporary** staging doc in `docs/temp/`. Promote to APM-managed `TEST_STRATEGY.md` when template workflow is active.  
> Template: parent repo `.apm/templates/TEST_STRATEGY.template.md`  
> Product plan: §6 Test plan, §22 P39

## 1. Executive Summary

Erganis uses **Jest** as the single platform test runner for Core, Nest backends, and web/mobile clients. Core Phase 0 establishes the pattern: unit tests colocated with modules, e2e tests in `services/test/`, PostgreSQL available in CI via GitHub Actions service container, and Testcontainers planned for local integration tests in later phases.

## 2. Validation Scope

| Phase | Core focus |
|-------|------------|
| **0 (done)** | Nest boot, `/health`, `/health/ready`, Postgres ping |
| **1** | OIDC, session/JWT, org context, role storage |
| **2** | Module loader, stub module, envelope smoke + txn rollback |
| **3** | Documents module + FileStore |

## 3. Test Layers

| Layer | Tooling | Location |
|-------|---------|----------|
| Unit | Jest + `@nestjs/testing` | `core/services/src/**/*.spec.ts` |
| E2E (HTTP) | Jest + supertest | `core/services/test/*.e2e-spec.ts` |
| Contracts | Jest (placeholder) | `core/contracts/` |
| CI DB | Postgres 16 service | `.github/workflows/ci.yml` → job `core` |
| Local DB (later) | Testcontainers | Phase 1+ integration tests |

## 4. Risk Areas

- Auth / SSO integration (Phase 1) — mock IdP + contract tests
- Orchestrator transaction rollback vs `partial` / `failed` (Phase 2)
- Cross-module envelope steps without cross-schema FKs (Phase 2–3)

## 5. Release Confidence

Phase 0 gate: `npm run build`, `npm test`, `npm run test:e2e` pass in CI with `DATABASE_URL` set.

## 6. Open Questions

- Testcontainers adoption timeline for local dev (vs Docker Compose only)
- Per-submodule CI workflows when split from monorepo parent
