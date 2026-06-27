#!/usr/bin/env bash
# Local development setup. Run from core repo root (erganis-core).

set -e

echo "Setting up Erganis Core local development..."

COMPOSE_FILE="infrastructure/docker/docker-compose.yml"
if command -v docker >/dev/null 2>&1 && [ -f "$COMPOSE_FILE" ]; then
  echo "Starting PostgreSQL via Docker (optional)..."
  docker compose -f "$COMPOSE_FILE" up -d postgres
  sleep 3
else
  echo "Ensure PostgreSQL is running (native install or Docker)."
fi

for dir in contracts packages/typescript services; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing dependencies in $dir..."
    (cd "$dir" && npm install)
  fi
done

echo "Setup complete."
echo "  - Postgres: localhost:5432 (db erganis, user erganis)"
echo "  - Core API: cd services && npm run start:dev (port 5000)"
echo "  - Jobs: pg-boss (PostgreSQL); no Redis required for v1."
