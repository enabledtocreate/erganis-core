# Temporary documentation (Core)

Staging area for Core design notes, implementation logs, and document fragments **before** APM-managed docs exist for this repo.

## Use this folder for

- Phase 0–3 implementation notes (Nest scaffold, auth, loader, orchestrator)
- Draft ADRs and technical spikes
- Architecture references (e.g. [`AUTH-ARCHITECTURE.md`](./AUTH-ARCHITECTURE.md) — Phase 1 auth review)
- Phase plans (e.g. [`PHASE-2.md`](./PHASE-2.md) — loader + DAL + envelope smoke)
- OpenAPI / envelope JSON Schema working notes
- Content destined for APM fragments (paste here first, promote via APM later)

## Do not use for

- Hand-editing final `ARCHITECTURE.md` / `PRD.md` in-repo (use APM when available)
- Secrets or `.env` values

## Cleanup

When a topic is promoted to APM or the product plan, remove or archive the scratch file here so `temp/` stays current.
