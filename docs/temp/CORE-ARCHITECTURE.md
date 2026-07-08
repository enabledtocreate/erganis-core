# Erganis Core — Architecture Reference

> **Status:** Core **C0–C16 complete**. **Next:** [Studio modules](../../studio/docs/STUDIO-IMPLEMENTATION-PLAN.md), [`erganis-ui`](../../../ui/docs/UI-ARCHITECTURE.md) (UI0).  
> **Companions:** [`CORE-IMPLEMENTATION-PLAN.md`](./CORE-IMPLEMENTATION-PLAN.md) · [`data/dal/README.md`](../../data/dal/README.md) · [`UI architecture`](../../../ui/docs/UI-ARCHITECTURE.md)

This document explains how Erganis Core is structured: shared types, database schemas, Nest modules, authentication, module loading, and operation orchestration. It is written for reviewers who may not be Nest or Postgres experts.

---

## 0. What Core is (platform model)

**Core is the shared operating system for every Erganis application.** Business features (Documents, Inventory, Build, Codes, Standards) live in **modules**. Core provides identity, contracts, data rules, APIs, orchestration, jobs, files, search, and composition hooks so modules and apps plug in the same way — first-party or third-party.

```mermaid
flowchart TB
  subgraph contracts [Layer 1 — Contracts in git]
    OpenAPI[core/contracts OpenAPI + JSON Schema]
    Manifest[erganis.module.json]
    PlatformPkg["@erganis/platform types"]
    UIContracts[erganis-ui contracts + tokens]
  end

  subgraph core [Layer 2 — Core runtime]
    Nest[core/services Nest API]
    Loader[Module loader + migrator]
    Orch[Orchestrator + locks]
    Jobs[pg-boss + outbox + search]
    Compose[Composition slots + themes]
    Auth[Auth + org RBAC]
  end

  subgraph data [Layer 2 — PostgreSQL]
    PlatformSchema[platform.*]
    ModuleSchemas[module schemas e.g. documents.*]
  end

  subgraph apps [Layer 3 — Applications]
    Studio[Studio + modules]
    Lyceum[Lyceum Mnemosyne / Nomodeion]
    Agora[Agora]
    Companion[Companion]
  end

  contracts --> core
  core --> data
  apps --> core
  UIContracts --> apps
```

**One sentence:** Contracts define the rules; Core enforces them at runtime; modules implement domain logic; apps render UX via [`erganis-ui`](../../../ui/docs/UI-ARCHITECTURE.md).

### 0.1 Contract system

| Contract kind | Source of truth | Core's job | Module / app job |
|---------------|-----------------|------------|------------------|
| **Platform HTTP API** | `core/contracts/schemas/core/openapi.yaml` | Host routes; validate auth | Optional OpenAPI fragments (future org composer) |
| **Operation envelope** | `core/contracts/schemas/envelope/` + `@erganis/platform` | Resolve steps; transactions; locks; audit | Register handlers in manifest |
| **Module manifest** | `core/contracts/schemas/module/` | Discover, validate, load handlers, apply migrations | Author `erganis.module.yaml` → JSON |
| **Public IDs & DAL** | `@erganis/platform` | Helpers (`createPublicId`, `BaseRepository`) | Use in handlers; UUIDs internal only |
| **Surface payloads** | Module + future per-surface JSON Schema | Surface API composes parallel loads | Implement `action: load` handlers |
| **UI composition** | Core slot/theme APIs (C10/C12) + `erganis-ui` contracts | Expose slots, tokens, skins JSON | Declare `contributions.ui`; render via UI packages |
| **Generated SDKs** | OpenAPI codegen → `core/contracts/sdk/` | Publish/version (C15 reserved path) | Consume SDK; no hand-written HTTP clients |

**Contracts are not stored as documents in Postgres.** Postgres holds **instances** (users, orgs, themes, module rows) and **registry** (enabled modules, applied migrations). Contract **definitions** live in git and are validated on load/build.

**Catalog (C15):** [`CORE-CONTRACTS-CATALOG.md`](./CORE-CONTRACTS-CATALOG.md) — platform schemas, slots, manifest contributions, agent/workflow endpoints.

### 0.2 Core libraries (what developers import)

| Package / area | Path | Used by | Purpose |
|----------------|------|---------|---------|
| **`@erganis/platform`** | `core/packages/typescript/` | Core services + all modules | Envelope, `StepHandler`, `BaseRepository`, public IDs, manifest types |
| **`@erganis/dal-postgres`** | `core/data/dal/` | Core services; modules via `unitOfWork.client` | Postgres adapters, `PgUnitOfWorkFactory` |
| **`core/services/`** | Nest runtime | Deployed API — **not imported by modules** | HTTP, loader, orchestrator, auth, jobs, files, search, composition |
| **`core/contracts/`** | Schemas + SDK output | CI, app repos | OpenAPI, JSON Schema, manifest compile |
| **`core/tools/`** | Done (C15) | Module authors, CI | Layout/manifest validation CLI |
| **`erganis-ui`** | `ui/` submodule | Studio, Lyceum, Companion | Headless + visual UI adapters — see [UI architecture](../../../ui/docs/UI-ARCHITECTURE.md) |

First-party and third-party modules use the **same** manifest, `@erganis/platform`, and migration rules. TypeScript first for server modules; other languages via generated **clients** (not alternate module runtimes in v1).

### 0.3 Runtime capabilities

**Built (C0–C12):** health/database, auth, module loader, orchestrator (envelope, locks, partial outcomes), module enable/disable, migration validation, FileStore, Surface API, Public API JWT, jobs/outbox/search, composition slots + theme preview, sync stub, operation audit.

**C13–C16 (done):** agent contract layer, workflow definitions with titled nodes, contract toolchain (`core/tools/`), layout validation + composition schemas API. Remaining optional: org API composer, full manifest RBAC, SAML — see [implementation plan](./CORE-IMPLEMENTATION-PLAN.md).

### 0.4 Module developer path

1. Create `studio/modules/{name}/` with `erganis.module.json`, `migrations/`, handlers.
2. SQL in **own schema** only — never `platform.*`.
3. Implement **`StepHandler`** with `BaseRepository` + `unitOfWork.client`.
4. Register operations (and optional jobs) in manifest; build; Core discovers on startup.
5. Apps call Core — never module code directly.

| Need | Mechanism |
|------|-----------|
| Save / mutate | Operation envelope → orchestrator |
| Load for UI | Surface API `action: load` |
| Files | Core FileStore API |
| Background | Manifest `contributions.jobs` |
| UI slot | Manifest `contributions.ui` + `erganis-ui` |

### 0.5 UI: Core vs erganis-ui vs apps

| Concern | Owner |
|---------|--------|
| Slot names, theme tokens/skins (JSON APIs) | **Core** C10/C12 |
| UI contract types, headless hooks, design tokens source | **`erganis-ui`** submodule |
| Shadcn reference web components | **`erganis-ui`** `@erganis/ui-shadcn` |
| MAUI/XAML, React Native adapters | **`erganis-ui`** per-platform packages |
| React pages and app routing | **Studio**, **Lyceum**, etc. |

Core **does not** ship Shadcn or React in `core/services/`. See [UI architecture § tiers](../../../ui/docs/UI-ARCHITECTURE.md).

### 0.6 First-party vs third-party

Same manifest format, libraries, orchestrator path, and per-org enable/disable (C5). Third-party modules: **mandatory** `migrations/` (C4); SQL limited to own schema.

### 0.7 What Core does not do

Domain logic (products, drawings, codes, standards), React rendering, Lyceum content (Mnemosyne/Nomodeion), Agora catalog, mobile shell UI, hand-written HTTP clients in app repos.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Authentication (authn)** | Proving *who you are* — password login or OIDC (Google/Microsoft/Okta). |
| **Authorization (authz)** | Deciding *what you are allowed to do* after login. Phase 1 stores roles and permissions; full enforcement expands in later phases. |
| **ACL** | **Access Control List** — explicit rules for who may read, write, or administer a resource. Core supplies roles (RBAC); modules apply ACL at resources and **connections** (e.g. Notes attach targets). |
| **Audit (platform)** | Core **operation audit log** (C9) — records envelope operations (who, what surface/action, outcome). Domain revision history (e.g. Notes document versions) is module-owned unless promoted to platform audit. |
| **OIDC (OpenID Connect)** | Modern “Sign in with …” standard. User visits an **identity provider (IdP)**, approves access, returns with proof of identity. Primary production login path. |
| **Local login / local fallback** | Email + password handled by Erganis (bcrypt in Postgres). For dev, testing, and break-glass — not the primary production path. |
| **JWT (JSON Web Token)** | Signed token for API clients. Sent in `Authorization` header; short TTL (`JWT_TTL_SECONDS`). |
| **Session** | Server-side record: “this browser is user X until time Y.” Browser holds an **HttpOnly cookie**; Postgres holds the session row. |
| **Domain JIT** | On first OIDC login, auto-create a user when their email domain is on the org allowlist. |
| **Org (organization)** | Tenant — e.g. “Acme Corp.” Users join orgs via **memberships** with a **role**. |
| **Slug** | URL-friendly org id — e.g. `acme` in `/auth/local/acme/login`. |
| **Public ID** | External identifier like `user_01HXYZ…`. Safe in APIs and JWTs. Internal joins use UUIDs. |
| **Repository** | Class that owns SQL for one domain (orgs, users, greetings, …). Extends **`BaseRepository`** or **`PgRepository`**. |
| **BaseRepository** | Core base in `@erganis/platform` — `queryOne`, `queryMany`, `execute`, `qualifiedTable`. |
| **DbUnitOfWork** | One database transaction. Orchestrator opens/commits/rolls back; handlers use `unitOfWork.client` only. |
| **QueryClient** | Interface `{ query(sql, params) }` — repositories depend on this instead of `pg` directly. |
| **PgRepository** | `@erganis/dal-postgres` helper — `BaseRepository` + `pg.Pool` constructor. Used by Core auth repos. |
| **`@erganis/dal-postgres`** | Postgres adapters: `asQueryClient`, `PgRepository`, `PgUnitOfWorkFactory`, Nest factories. |
| **Operation envelope** | JSON request describing a user action: surface, action, org, payload. Core resolves and runs registered **steps**. |
| **Surface** | UI or API context id — e.g. `stub`, `documents`, `inventory`. Modules register steps per surface. |
| **Action** | Verb on a surface — `load`, `save`, `draft`, `archive`, `approve`, `sync`. |
| **Step / step handler** | One unit of work inside an envelope. Module exports a function; loader registers it by `{moduleId}:{handlerName}`. |
| **Step phase** | When a step runs: `db` (inside transaction) or `post_commit` (after commit). |
| **Failure class** | `required` (abort on failure), `optional`, or `advisory` (warning → `partial` outcome). |
| **Orchestrator** | Core service that resolves steps from manifests, builds **OperationContext**, runs handlers under **DbUnitOfWork**. |
| **Module manifest** | `erganis.module.json` — module id, version, entry point, operations, migrations. |
| **Module loader** | Discovers manifests under `MODULES_ROOT`, applies module SQL, loads handler exports. |
| **MODULES_ROOT** | Directory scanned for modules — default `studio/modules` from services cwd. |
| **Hello-world stub** | Phase 2 reference module (`erganis.hello-world`) proving loader + envelope + `BaseRepository` in a transaction. |
| **Mock IdP** | Fake OIDC for tests (`AUTH_OIDC_MOCK=true`). Codes like `mock-code:user@acme.com`. |
| **Guard** | Nest middleware before a route — e.g. `SessionGuard` on `/operations/execute`. |
| **Migration** | Versioned SQL — platform migrations in `core/data/migrations/`; module migrations in each module folder. |
| **Schema (database)** | Postgres namespace — `platform` (Core), `hello_world` (stub module), future per-module schemas. |
| **E2E test** | Full HTTP + real Postgres; see `services/test/*.e2e-spec.ts`. |

---

## 1. Design goals (Phases 0–2)

| Phase | Goal | How it is met |
|-------|------|----------------|
| **0 — Shell** | Runnable Core API + Postgres | Nest app, `HealthModule`, `DatabaseModule`, `MigrationRunner` |
| **1 — Auth** | Platform identity | OIDC + local fallback, session cookie, JWT, org/membership/roles, domain JIT |
| **C2 — Loader + envelope** | Extensible modules + transactional saves | Manifest discovery, module migrations, `OrchestratorService`, authenticated `POST /operations/execute` |
| **C3–C12 — Platform** | Hardening + composition | **Complete** — locks, FileStore, Surface API, migration validation, module enable/disable, public API, platform events, composition, sync stub, theme preview |
| **C13–C16 — Complete** | Agent JSON, workflows, contracts toolchain, UI validation | **Done** — see [implementation plan](./CORE-IMPLEMENTATION-PLAN.md) |

**Studio modules** (Documents, Inventory, …) are **not Core phases** — they ship as [Studio slices](../../../docs/erganis-product-plan.md#studio-module-implementation-phases) (S-D1, S-I1, …).

---

## 2. Repository layout

```
core/
├── data/
│   ├── dal/                              # @erganis/dal-postgres
│   ├── migrations/
│   │   ├── 001_platform_auth.sql         # Phase 1 — orgs, users, sessions, …
│   │   └── 002_platform_modules.sql      # Phase 2 — enabled_modules, module_migrations
│   └── sql/
├── packages/typescript/                  # @erganis/platform
│   └── src/
│       ├── auth-types.ts
│       ├── public-id.ts
│       ├── dal/
│       ├── orchestration/                # envelope, context, step handlers, utils
│       ├── modules/                      # module manifest types
│       └── index.ts
└── services/                             # @erganis/core-services (Nest)
    └── src/
        ├── app.module.ts
        ├── main.ts
        ├── config/configuration.ts
        └── modules/
            ├── database/
            ├── health/                   # Phase 0
            ├── auth/                     # Phase 1
            ├── loader/                   # Phase 2
            └── orchestrator/             # Phase 2

studio/modules/                           # First-party modules (not inside core/)
└── hello-world/                          # Phase 2 stub
    ├── erganis.module.json
    ├── migrations/
    └── src/handlers/ping-save.ts
```

### Layering (Core services)

```mermaid
flowchart TB
  subgraph http [HTTP]
    HC[HealthController]
    AC[AuthController]
    OC[OperationsController]
    SG[SessionGuard]
  end

  subgraph app [Application]
    AS[AuthService]
    OS[OrchestratorService]
    MLS[ModuleLoaderService]
  end

  subgraph infra [Infrastructure]
    Repos[Auth repositories]
    OIDC[OidcAuthProvider]
    MDS[ModuleDiscoveryService]
    MMS[ModuleMigrationService]
  end

  subgraph modules [Loaded modules]
    HH[hello-world pingSave]
  end

  subgraph dal [DAL]
    BR[BaseRepository]
    UoW[PgUnitOfWorkFactory]
  end

  HC --> DB[(PostgreSQL)]
  AC --> AS
  OC --> SG
  SG --> AS
  OC --> OS
  OS --> MLS
  OS --> Repos
  OS --> UoW
  MLS --> MDS
  MLS --> MMS
  MLS --> HH
  HH --> BR
  Repos --> BR
  UoW --> DB
  AS --> Repos
  AS --> OIDC
```

---

## 3. Shared package (`@erganis/platform`)

Built before services compile. No Nest, no `pg`.

### `public-id.ts`

| Function | Purpose |
|----------|---------|
| `createPublicId(type)` | `{type}_{ulid}` e.g. `user_01H…`, `greeting_01H…` |
| `isValidPublicId(value)` | Regex validation |
| `parsePublicIdType(value)` | Extract type prefix |

### `auth-types.ts`

| Export | Purpose |
|--------|---------|
| `AuthMode`, `AuthProviderType` | Per-org login policy |
| `AuthUser`, `AuthOrg`, `AuthRole`, `AuthSessionView` | Session/API views |
| `OidcProfile`, `JwtClaims` | IdP normalization; JWT payload (`sub` = user public id) |

### `dal/`

| Export | Purpose |
|--------|---------|
| `QueryClient`, `QueryResult` | Repository database access |
| `BaseRepository` | Shared query helpers |
| `DbUnitOfWork`, `DbUnitOfWorkFactory` | Transaction scope for envelope steps |

PostgreSQL adapters: **`@erganis/dal-postgres`** — `asQueryClient`, `PgRepository`, `PgUnitOfWorkFactory`, `createPoolRepository`.

### `orchestration/` (Phase 2)

| Export | Purpose |
|--------|---------|
| `OperationAction` | `load` \| `save` \| `draft` \| `archive` \| `approve` \| `sync` |
| `OperationEnvelope` | Client request: `surfaceId`, `action`, `orgSlug`, `payload`, optional entity ids |
| `OperationContext` | Injected into handlers: org/user public ids, operation id, surface, action |
| `OperationResult`, `OperationStepResult` | Orchestrator response with per-step status |
| `StepHandler` | `(context, unitOfWork, payload) => Promise<StepHandlerResult>` |
| `stepHandlerKey(moduleId, handler)` | Registry key `{moduleId}:{handlerName}` |
| `resolveStepsForOperation` | Match manifest operations to surface + action |
| `computeOutcome` | `success` \| `partial` \| `failed` from step results |
| `createOperationId` | Generate operation id when client omits one |

### `modules/` (Phase 2)

| Export | Purpose |
|--------|---------|
| `ModuleManifest` | Parsed `erganis.module.json` shape |
| `ModuleManifestOperation` | surfaceId, action, stepId, handler, failureClass, phase |
| `DiscoveredModule` | Manifest + filesystem root path |

---

## 4. Database schema

### Platform auth — `001_platform_auth.sql`

Applied by `MigrationRunner` on startup (unless `RUN_MIGRATIONS_ON_START=false`).

| Table | Purpose |
|-------|---------|
| `platform.orgs` | Tenant: slug, name, `allowed_domains[]`, `auth_mode` |
| `platform.users` | Global user; optional `password_hash` |
| `platform.roles` | Per-org roles; `is_admin` |
| `platform.org_memberships` | user ↔ org ↔ role |
| `platform.sessions` | Server sessions; **SHA-256 hash** of cookie token |
| `platform.oidc_identities` | `(issuer, subject)` → user |
| `platform.org_oidc_config` | Per-org OIDC client settings |
| `platform.schema_migrations` | Platform SQL version tracking |

### Platform modules — `002_platform_modules.sql`

| Table | Purpose |
|-------|---------|
| `platform.enabled_modules` | Which modules are loaded; installed version |
| `platform.module_migrations` | Per-module SQL migration tracking |

### Module schemas & migration policy

Module DDL lives in each module’s **`migrations/`** folder. **Only Core** (`ModuleMigrationService`) discovers, validates, and applies these files — modules never run DDL at startup or bypass Core.

| Module class | `migrations/` folder | DDL scope |
|--------------|---------------------|-----------|
| **First-party** (`studio/modules/*`, `agora/modules/*`) | Single `migrations/` directory per module | Own module schema only (e.g. `hello_world.*`, `documents.*`) |
| **Third-party** (`studio/modules/third-party/*`) | **Mandatory** — Core rejects enable if absent | Own schema only; **forbidden** from `platform.*` and all first-party schemas |

**Phase 2 (implemented):** Manifest-listed SQL applied in version order; recorded in `platform.module_migrations`.  
**Phase 3+ (planned):** Static SQL validation — schema allowlist, third-party folder check, block cross-schema DDL.

Platform DDL remains in `core/data/migrations/` only.

#### Example: hello-world

| Object | Purpose |
|--------|---------|
| `hello_world.greetings` | Stub table: `public_id`, `org_id`, `message`, audit columns |

---

## 5. Phase 0 — Shell & health

| Component | Location | Behavior |
|-----------|----------|----------|
| `AppModule` | `app.module.ts` | Wires global config, database, health, auth, orchestrator |
| `DatabaseService` | `database/database.service.ts` | Optional `pg.Pool` from `DATABASE_URL` |
| `MigrationRunner` | `database/migration.runner.ts` | Runs platform SQL on `OnModuleInit` |
| `HealthController` | `health/controllers/` | `GET /health` — liveness; `GET /health/ready` — DB ping or `skipped` |

---

## 6. Phase 1 — Authentication

Phase 1 establishes **platform identity** in Core — not Studio UI.

| Goal | Implementation |
|------|----------------|
| OIDC v1 | `OidcAuthProvider` + `org_oidc_config` |
| Local fallback | `POST /auth/local/:orgSlug/login` + bcrypt |
| Web sessions | HttpOnly cookie (`erganis_session`) |
| Public API | JWT via `POST /auth/token` |
| Multi-tenant | Org slug in URL; membership per org |
| Domain JIT | OIDC auto-provision when domain ∈ allowlist |
| Admin bootstrap | First JIT user gets org admin role |
| Testability | Mock IdP; unit spec per class |

### Infrastructure (auth repositories)

All extend **`PgRepository`** via `createPoolRepository(Repo, pool)`.

| Repository | Responsibility |
|------------|----------------|
| `OrgRepository` | Orgs, OIDC config, admin role bootstrap |
| `UserRepository` | Users by email/id/publicId; create with public id |
| `MembershipRepository` | Org membership + role join |
| `SessionRepository` | Token generation, SHA-256 storage, expiry |
| `IdentityRepository` | OIDC issuer/subject linking |

`OidcAuthProvider` interface — `MockOidcAuthProvider` (`AUTH_OIDC_MOCK`) or `HttpOidcAuthProvider` (real IdP). SAML can follow the same adapter pattern later.

### Application services

| Service | Role |
|---------|------|
| `DomainJitService` | Email domain allowlist rules |
| `PasswordService` | bcrypt hash/verify |
| `TokenService` | JWT + signed OIDC state |
| `SessionService` | Cookie options + session CRUD |
| `AuthService` | Login flows, JIT provisioning, session view, JWT issuance |

### HTTP — `/auth`

| Route | Guard | Purpose |
|-------|-------|---------|
| `POST /local/:orgSlug/login` | — | Local login + Set-Cookie |
| `GET /oidc/:orgSlug/start` | — | Authorization URL + state |
| `GET /oidc/:orgSlug/callback` | — | Complete OIDC + Set-Cookie |
| `GET /me/:orgSlug` | SessionGuard | Current session view |
| `POST /logout` | SessionGuard | Revoke session |
| `POST /token` | — | JWT from cookie or email/password |

### Auth request flow (local login)

```mermaid
sequenceDiagram
  participant Browser
  participant AC as AuthController
  participant AS as AuthService
  participant DB as PostgreSQL

  Browser->>AC: POST /auth/local/acme/login
  AC->>AS: loginLocal
  AS->>DB: org, user, membership
  AS->>DB: insert session (hashed token)
  AC-->>Browser: Set-Cookie + AuthSessionView
```

---

## 7. Phase 2 — Module loader & orchestrator

### Startup order

1. **`MigrationRunner.onModuleInit`** — applies `001_*`, `002_*` platform SQL.
2. **`ModuleLoaderService.onApplicationBootstrap`** — skipped if no `DATABASE_URL`; otherwise discovers modules, runs module migrations, registers handlers.

Handlers load via **`createRequire`** from each module’s `package.json` (works in Nest and Jest).

### Loader components

| Service | Responsibility |
|---------|----------------|
| `ModuleDiscoveryService` | Scan `MODULES_ROOT` for `erganis.module.json` |
| `ModuleMigrationService` | Apply module SQL files **(Core-only)**; validate paths from manifest; record in `platform.module_migrations`. Phase 3+ adds SQL schema allowlist and mandatory third-party `migrations/` check. |
| `ModuleRegistryRepository` | Track enabled modules and migration state |
| `ModuleLoaderService` | Orchestrate discover → migrate → require handlers → registry |

### Orchestrator

| Component | Responsibility |
|-----------|----------------|
| `OrchestratorService` | Resolve steps, build `OperationContext`, run `phase: db` in `PgUnitOfWorkFactory.runInTransaction`, then `post_commit` steps |
| `OperationsController` | HTTP adapter for module operations |

### HTTP — `/operations`

| Route | Guard | Purpose |
|-------|-------|---------|
| `GET /modules` | — | List loaded modules and their operation contributions |
| `POST /execute` | SessionGuard | Run envelope; requires session cookie |

**Execute flow:** resolve org by slug → load user → build context → resolve steps from manifests → run handlers → return `OperationResult` with outcome and per-step status.

Required step failure inside the DB transaction throws → rollback → `422` with step details.

### Envelope request flow

```mermaid
sequenceDiagram
  participant Browser
  participant OC as OperationsController
  participant OS as OrchestratorService
  participant UoW as PgUnitOfWorkFactory
  participant H as pingSave handler
  participant DB as PostgreSQL

  Browser->>OC: POST /operations/execute + Cookie
  OC->>OS: execute(envelope, userId, userPublicId)
  OS->>UoW: runInTransaction
  UoW->>H: pingSave(context, unitOfWork, payload)
  H->>DB: INSERT hello_world.greetings
  UoW->>DB: COMMIT
  OS-->>Browser: OperationResult outcome success
```

### Hello-world stub module

Location: `studio/modules/hello-world/`

| Item | Value |
|------|-------|
| Module id | `erganis.hello-world` |
| Surface / action | `stub.save` |
| Handler | `pingSave` — extends `BaseRepository`, inserts greeting with public id |
| Build | `npm install && npm run build` (CI and e2e global setup do this automatically) |

Example envelope body:

```json
{
  "surfaceId": "stub",
  "action": "save",
  "orgSlug": "acme",
  "payload": { "message": "hello" }
}
```

### Module author pattern (handlers)

Full worked examples — manifest, migration SQL, HTTP curl, orchestrator resolution, and new-module checklist — are in [§11 Implementation examples](#11-implementation-examples).

See also [`data/dal/README.md`](../../data/dal/README.md) and [`CORE-IMPLEMENTATION-PLAN.md`](./CORE-IMPLEMENTATION-PLAN.md) (C2).

---

## 8. Nest module wiring

### `AppModule`

```typescript
imports: [
  ConfigModule,
  DatabaseModule,
  HealthModule,
  AuthModule,
  OrchestratorModule,
  FileModule,
  SurfaceModule,
  PublicApiModule,
  PlatformServicesModule,
  CompositionModule,
  SyncModule,
  JobModule,
  OutboxModule,
  SearchModule,
]
```

### Platform services (C9–C12)

| Module | Responsibility |
|--------|----------------|
| `PlatformServicesModule` | Operation audit log + outbox enqueue |
| `JobModule` | pg-boss runtime; module job handler registration |
| `OutboxModule` | Polls `outbox_events`, dispatches to `EventDispatcher` |
| `EventModule` | Registers platform event handlers (e.g. `operation.completed`) |
| `SearchModule` | `platform.search_index` FTS upsert + `GET /search` |
| `CompositionModule` | Slots (C10) + theme tokens/skins/preview (C12) |

### `AuthModule`

- Wires auth repositories via `createPoolRepository`.
- Binds OIDC mock vs HTTP provider from config.
- **Exports:** `AuthService`, `SessionService`, `SessionGuard`, `TokenService`, `JwtAuthGuard`, `UserRepository`.

### `LoaderModule`

- `ModuleDiscoveryService`, `ModuleMigrationService`, `ModuleLoaderService`.
- `ModuleRegistryRepository` via `createPoolRepository`.

### `OrchestratorModule`

- `OrchestratorService`, `OperationsController`.
- Re-provides `OrgRepository`, `UserRepository` for execute path.

---

## 9. Configuration

From `services/.env.example` → `configuration.ts`:

| Env var | Default | Purpose |
|---------|---------|---------|
| `DATABASE_URL` | — | Postgres; required for auth, loader, orchestrator |
| `JWT_SECRET` | dev placeholder | JWT + OIDC state signing |
| `SESSION_COOKIE_NAME` | `erganis_session` | Session cookie |
| `SESSION_TTL_SECONDS` | `86400` | Session lifetime |
| `JWT_TTL_SECONDS` | `3600` | Access token lifetime |
| `OIDC_CALLBACK_BASE_URL` | `http://localhost:5000` | OIDC redirect base |
| `AUTH_LOCAL_ENABLED` | `true` | Kill switch for local login |
| `AUTH_OIDC_MOCK` | `false` | Mock IdP for dev/CI |
| `MIGRATIONS_DIR` | `../data/migrations` | Platform SQL path |
| `RUN_MIGRATIONS_ON_START` | `true` | Auto-run platform migrations |
| `MODULES_ROOT` | `../../studio/modules` | Module discovery root |
| `JOBS_ENABLED` | `true` | pg-boss job runner |
| `OUTBOX_ENABLED` | `true` | Outbox poller |
| `OUTBOX_POLL_INTERVAL_MS` | `2000` | Outbox poll interval |
| `API_PORT` / `API_HOST` | `5000` / `0.0.0.0` | HTTP bind |

---

## 10. Testing map

| Area | Spec / test | Proves |
|------|-------------|--------|
| Public IDs | `public-id.spec.ts` | Format, validation |
| DAL | `dal/*.spec.ts`, `data/dal/src/*.spec.ts` | BaseRepository, transactions |
| Orchestration utils | `orchestration-utils.spec.ts` | Step resolution, outcome |
| Auth (unit) | `auth/**/*.spec.ts` | All Phase 1 units |
| Module discovery | `module-discovery.service.spec.ts` | Manifest scan |
| Orchestrator | `orchestrator.service.spec.ts` | Step execution, rollback |
| Migration runner | `migration.runner.spec.ts` | Platform SQL apply/skip |
| Auth E2E | `test/auth.e2e-spec.ts` | Login, OIDC mock, JWT |
| Operations E2E | `test/operations.e2e-spec.ts` | Authenticated envelope smoke |
| App E2E | `test/app.e2e-spec.ts` | Health endpoints |
| E2E setup | `test/global-setup.js` | Builds hello-world when `DATABASE_URL` set |

E2E seed: `test/helpers/auth-seed.ts` — org `acme`, admin user, OIDC config. E2E runs with `maxWorkers: 1` to avoid DB races.

---

## 11. Implementation examples

Worked examples from the **running codebase** (hello-world stub + Core services). Use as templates for Core platform work or new Studio modules.

### 11.1 End-to-end flow (what happens on save)

```mermaid
sequenceDiagram
  participant UI as Studio / curl
  participant Auth as POST /auth/local
  participant Ops as POST /operations/execute
  participant Core as OrchestratorService
  participant Mod as Module handler
  participant DB as PostgreSQL

  UI->>Auth: email + password
  Auth->>DB: verify user, create session
  Auth-->>UI: Set-Cookie erganis_session

  UI->>Ops: envelope JSON + Cookie
  Ops->>Core: resolve org, user, steps
  Core->>DB: BEGIN
  Core->>Mod: pingSave(context, unitOfWork, payload)
  Mod->>DB: INSERT hello_world.greetings
  Core->>DB: COMMIT
  Ops-->>UI: OperationResult outcome success
```

**Rules:** (1) Login first — session cookie or JWT. (2) Writes go through the **envelope**. (3) Handlers use **`unitOfWork.client`**. (4) Use **`context.orgId`** internally; **`context.userPublicId`** in audit columns.

### 11.2 HTTP examples (local dev)

Core at `http://localhost:5000`, org `acme`, user `admin@acme.com` / `test-password` (e2e seed).

**Login**

```http
POST /auth/local/acme/login
Content-Type: application/json

{"email":"admin@acme.com","password":"test-password"}
```

**Execute envelope** (send `Cookie: erganis_session=…` from login)

```http
POST /operations/execute
Content-Type: application/json

{
  "surfaceId": "stub",
  "action": "save",
  "orgSlug": "acme",
  "payload": { "message": "hello from example" }
}
```

**JWT for API clients**

```http
POST /auth/token
Content-Type: application/json

{"orgSlug":"acme","email":"admin@acme.com","password":"test-password"}
```

### 11.3 First-party module package layout

```
studio/modules/hello-world/
├── erganis.module.json
├── package.json
├── migrations/001_hello_world.sql    # Core applies — module never runs DDL
└── src/
    ├── index.ts                      # exports pingSave
    └── handlers/ping-save.ts
```

Third-party: same shape under `studio/modules/third-party/{vendor}/` with **mandatory** `migrations/`.

### 11.4 Manifest snippet

```json
{
  "id": "erganis.hello-world",
  "entryPoint": "./dist/index.js",
  "contributions": {
    "operations": [{
      "surfaceId": "stub",
      "action": "save",
      "stepId": "hello-save",
      "handler": "pingSave",
      "failureClass": "required",
      "phase": "db"
    }]
  },
  "migrations": [{ "version": "001", "path": "./migrations/001_hello_world.sql" }]
}
```

### 11.5 Step handler (from repo)

```typescript
export const pingSave: StepHandler = async (context, unitOfWork, payload) => {
  const repo = new GreetingRepository(unitOfWork.client);
  const publicId = createPublicId('greeting');
  const message = String(payload.message ?? 'hello from stub');
  await repo.insertGreeting({
    orgId: context.orgId,
    message,
    createdByPublicId: context.userPublicId,
    operationId: context.operationId,
    publicId,
  });
  return { message: 'Greeting saved', data: { greetingPublicId: publicId, message } };
};
```

Full file: `studio/modules/hello-world/src/handlers/ping-save.ts`. Build: `npm install && npm run build` in module dir.

### 11.6 Core repository (auth)

```typescript
@Injectable()
export class OrgRepository extends PgRepository {
  async findBySlug(slug: string): Promise<OrgRecord | null> {
    return this.queryOne(
      `SELECT id, public_id, slug, name, allowed_domains, auth_mode
       FROM platform.orgs WHERE slug = $1`,
      [slug],
      mapOrg,
    );
  }
}
```

Core repos: **`PgRepository`** + pool. Module handlers: **`BaseRepository`** + `unitOfWork.client`.

### 11.7 Orchestrator resolution (step by step)

1. `SessionGuard` → `userId` → load `userPublicId`
2. Find org by `envelope.orgSlug`
3. `resolveStepsForOperation(surfaceId, action, loadedModules)`
4. `PgUnitOfWorkFactory.runInTransaction` for each `phase: db` step
5. Handler lookup: `"erganis.hello-world:pingSave"` via `stepHandlerKey()`
6. Return `OperationResult` with per-step status and `outcome`

### 11.8 New Studio module checklist

| Step | Action |
|------|--------|
| 1 | Create `studio/modules/{name}/` + manifest + `migrations/` |
| 2 | SQL in **own schema only** (`documents.*`, not `platform.*`) |
| 3 | Implement `StepHandler`(s) with `BaseRepository` |
| 4 | Register operations in manifest |
| 5 | Build module; set `MODULES_ROOT`; restart Core |
| 6 | Login → test `POST /operations/execute` |

| Need | Core phase |
|------|------------|
| Envelope save | **C2** (done) |
| File bytes | **C6** FileStore |
| Surface UI load | **C7** (done) + Studio **S0** |
| Multi-step partial | **C3** |
| Third-party | **C4** migration validation |

### 11.9 Local dev environment

```bash
# core/services/.env
DATABASE_URL=postgresql://erganis:dev_password@localhost:5432/erganis
MODULES_ROOT=../../studio/modules
AUTH_LOCAL_ENABLED=true
RUN_MIGRATIONS_ON_START=true
```

```bash
cd core/packages/typescript && npm run build
cd ../../../studio/modules/hello-world && npm install && npm run build
cd ../../../core/services && npm run start:dev
```

---

## 12. Known limitations & next steps

| Topic | Current behavior | Likely follow-up |
|-------|------------------|------------------|
| Role management | Admin bootstrap only | Studio admin UI |
| JWT API guard | **C8** — `JwtAuthGuard` on `/public/v1/*` | Expand to additional public routes |
| Refresh tokens / MFA | Not implemented | Product decision |
| SAML | Type only | New provider adapter |
| Module enable/disable | **C5** (done) | Studio admin UI |
| Module migration validation | **C4** (done) | — |
| Envelope JSON Schema | **C3** (done) | — |
| Operation audit / outbox | **C9** (done) | External webhook publisher |
| pg-boss jobs | **C9** (done) | Manifest `schedule` cron |
| Search FTS | **C9** (done) | Cross-entity unified search UI |
| Sync API | **C11** in-memory stub | Persist via entity locks + module data |
| Documents module | Not started | Studio **S-D1** + Core **C6** |
| Compensation / rollback across modules | Required DB failure rolls back transaction | Multi-step partial outcomes (Inventory) |

---

## 13. Review checklist

- [ ] Auth repos extend `PgRepository`; module handlers use `BaseRepository` + `unitOfWork.client`.
- [ ] Public IDs in external responses; UUIDs internal only.
- [ ] Session cookie HttpOnly; JWT for API clients.
- [ ] Platform migrations run before module loader (`OnModuleInit` → `OnApplicationBootstrap`).
- [ ] Module handlers never call `BEGIN`/`COMMIT` — orchestrator owns transactions.
- [ ] Only Core runs module migrations — no startup DDL in module entry points.
- [ ] Third-party modules have mandatory `migrations/`; DDL limited to own schema.
- [ ] Third-party SQL must not target `platform.*` or first-party module schemas.
- [ ] `SessionGuard` protects `/operations/execute`.
- [ ] Mock IdP disabled in production.
- [ ] `JWT_SECRET` rotated for real deployments.
- [ ] Hello-world built before running Core with modules in dev/CI.

---

*Promote sections to APM `ARCHITECTURE.md` / `TECHNICAL_DESIGN.md` when ready.*
