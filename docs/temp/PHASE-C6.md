# Core C6 — FileStore

> **Status:** Complete.

## Deliverables

| Unit | Purpose |
|------|---------|
| `LocalFileStoreService` | Writes under `{ERGANIS_DATA_ROOT}/{orgId}/{namespace}/` |
| `FilesController` | `POST /files/:orgSlug/upload`, `GET /files/:orgSlug/*` |
| `FileModule` | Wired into AppModule |

## Env

`ERGANIS_DATA_ROOT` — required for file operations.

## Upload example

```http
POST /files/acme/upload
Content-Type: application/json
Cookie: erganis_session=…

{
  "fileName": "cert.pdf",
  "contentType": "application/pdf",
  "dataBase64": "…"
}
```

Returns `{ fileId, relativePath, sizeBytes, contentType }`.
