# Core C4 — Migration Validation

> **Status:** Complete.  
> **Depends on:** [C2](./PHASE-2.md), [C3](./PHASE-C3.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `module-migration.validator.ts` | `loader/` | SQL schema allowlist; third-party folder check |
| `ModuleMigrationService` | updated | Validates before `runSql` |
| Tests | `module-migration.validator.spec.ts` | Third-party vs first-party rules |

## Rules enforced

- **Third-party** modules (`…/third-party/…` in path) must have a **`migrations/`** folder.
- Third-party SQL **cannot** reference `platform.*` or known first-party schemas (`hello_world`, `documents`, …).
- First-party modules: validation is permissive (own schema only by convention).

## References

- Product plan [§12 Module migrations](../../../docs/erganis-product-plan.md#module-migrations-decided)
