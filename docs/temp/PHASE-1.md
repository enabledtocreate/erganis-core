# Phase 1 — Platform Auth

Phase 1 adds OIDC v1 with local fallback, HttpOnly session cookies (web), JWT access tokens (public API), org/users/roles, and domain JIT provisioning.

**Architecture reference (for review):** [`AUTH-ARCHITECTURE.md`](./AUTH-ARCHITECTURE.md)

## Delivered

| Unit | Location | Tests |
|------|----------|-------|
| Public IDs + auth types | `packages/typescript/src/` | `public-id.spec.ts` |
| Auth schema migration | `data/migrations/001_platform_auth.sql` | `migration.runner.spec.ts` |
| Domain JIT | `auth/application/domain-jit.service.ts` | `domain-jit.service.spec.ts` |
| Password hashing | `auth/application/password.service.ts` | `password.service.spec.ts` |
| JWT + OIDC state | `auth/application/token.service.ts` | `token.service.spec.ts` |
| Sessions | `auth/application/session.service.ts` | `session.service.spec.ts` |
| OIDC providers (mock + HTTP) | `auth/infrastructure/oidc-auth.provider.ts` | `oidc-auth.provider.spec.ts` |
| Repositories | `auth/infrastructure/*.repository.ts` | `*.repository.spec.ts` |
| Auth orchestration | `auth/application/auth.service.ts` | `auth.service.spec.ts` |
| HTTP routes | `auth/controllers/auth.controller.ts` | `auth.controller.spec.ts` |
| Session guard | `auth/guards/session.guard.ts` | `session.guard.spec.ts` |
| E2E flows | `services/test/auth.e2e-spec.ts` | local login, OIDC mock, JWT, logout |

## Routes

- `POST /auth/local/:orgSlug/login` — local fallback (sets session cookie)
- `GET /auth/oidc/:orgSlug/start` — begin OIDC (returns `authorizationUrl`, `state`)
- `GET /auth/oidc/:orgSlug/callback` — complete OIDC (sets session cookie)
- `GET /auth/me/:orgSlug` — session view (requires cookie)
- `POST /auth/logout` — revoke session
- `POST /auth/token` — JWT from session cookie or email/password

## Local dev

```bash
cd core
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres
cd services
cp .env.example .env
npm ci && npm run build && npm run start:dev
```

Set `AUTH_OIDC_MOCK=true` to use mock IdP codes: `mock-code:user@domain.com`.

## CI

Core job sets `AUTH_OIDC_MOCK=true`, `JWT_SECRET`, and Postgres. E2E auth tests run when `DATABASE_URL` is set.

## Deferred

- SAML provider implementation (interface ready via `OidcAuthProvider` pattern)
- Studio admin UI for org/role management
- Live Google/Microsoft IdP in CI (mock only)
