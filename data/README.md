# Erganis Data Layer

**Data tier** — database access, migrations, and SQL.

## Structure

- `dal/` — Database Abstraction Layer (DAL) — data access code
- `migrations/` — Database migration scripts (versioned)
- `sql/` — SQL logic, stored procedures, views

## Purpose

- **Persistence** — Database schemas, migrations, and data access layer
- **Data logic** — SQL scripts, stored procedures, database-specific code

## Usage

- **Services** use the DAL for data access (reference this folder via relative path)
- Migrations are run as part of deployment pipelines

## Environment variables

Copy `.env.example` to `.env` for migration and DAL tooling.

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_HOST` | Yes | Database host |
| `POSTGRES_PORT` | No | Port (default 5432) |
| `POSTGRES_DB` | Yes | Database name |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `MIGRATION_DIR` | No | Path to migrations (default ./migrations) |
| `MIGRATION_TABLE` | No | Migrations tracking table (default schema_migrations) |
