# Core C10 — UI Toolbox / Composition

> **Status:** Complete.  
> **Depends on:** [C9](./PHASE-C9.md).

## Deliverables

| Unit | Location | Purpose |
|------|----------|---------|
| `CompositionController` | `GET /composition/slots` | Lists registered UI composition slots |
| `CompositionModule` | Wired into `AppModule` | Static slot registry (Studio modules extend in later phases) |

## Default slots

| slotId | region | Description |
|--------|--------|-------------|
| `shell.header` | header | Top navigation bar |
| `shell.sidebar` | sidebar | Primary navigation |
| `shell.main` | main | Primary content area |
| `dashboard.widget` | dashboard | Dashboard widgets |

## HTTP example

```http
GET /composition/slots
```

```json
{
  "slots": [
    { "slotId": "shell.header", "region": "header", "description": "Top navigation bar" }
  ]
}
```

Studio **S0** will map module UI contributions into these slots.

## References

- Product plan C10
