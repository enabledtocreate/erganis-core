# Core C5 — Module Enable/Disable per Org

> **Status:** Complete.  
> **Depends on:** [C4](./PHASE-C4.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `004_platform_org_modules.sql` | `data/migrations/` | `org_module_settings` table |
| `OrgModuleRepository` | `loader/org-module.repository.ts` | Per-org enabled flag + disabled step ids |
| `ModuleAccessService` | `loader/module-access.service.ts` | **403** `MODULE_DISABLED` / `OPERATION_DISABLED` |
| `ModuleAdminController` | `POST /admin/modules/:orgId/:moduleId/enable` | Toggle module for org |
| Orchestrator integration | `orchestrator.service.ts` | Checks access before execute |

## HTTP

```http
POST /admin/modules/{orgUuid}/{moduleId}/enable
Cookie: erganis_session=…
{"enabled": false}
```

Disabled module → `POST /operations/execute` returns **403** with `code: MODULE_DISABLED`.

## References

- Product plan C5
