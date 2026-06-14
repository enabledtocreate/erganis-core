#!/usr/bin/env bash
# Validate required environment variables. Source from .env first, then run.
# Usage: source .env 2>/dev/null; ./scripts/validate-env.sh
# Or: export DATABASE_URL=...; ./scripts/validate-env.sh

MISSING=0

check() {
  if [ -z "${!1}" ]; then
    echo "Missing required env var: $1"
    MISSING=1
  fi
}

# Required for services (adjust per repo if run from a specific repo)
check DATABASE_URL

if [ "$MISSING" -eq 1 ]; then
  echo "Set the variables above (e.g. copy .env.example to .env and fill in)."
  exit 1
fi

echo "Required env vars are set."
exit 0
