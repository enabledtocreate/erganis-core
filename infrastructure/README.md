# Erganis Infrastructure

**Runtime & deployment tier** — Docker, container configs, and infrastructure-as-code.

## Structure

- `docker/` — Dockerfiles, docker-compose, container configs
- `deployment/` — Infrastructure-as-code (Terraform, ARM, CloudFormation, etc.)

## Purpose

- **Runtime** — Local PostgreSQL via Docker (**optional**) or native install on Windows/Linux
- **Deployment** — Provisioning, CI/CD, and environment configs

## Related

- **Data layer** (DAL, migrations, SQL) lives in **`../data/`**.
- **Services** use the data layer for persistence and may use Docker configs here for local dev.

## Environment variables

Copy `.env.example` to `.env` for Docker and deployment scripts.

| Variable | Required | Description |
|----------|----------|-------------|
| `DOCKER_REGISTRY` | No | Container registry base URL |
| `DOCKER_IMAGE_PREFIX` | No | Image name prefix (default erganis) |
