#!/usr/bin/env bash
# Run E2E tests (parent repo).
# Requires full platform: git submodule update --init --recursive
# Start services first (e.g. scripts/dev/setup-local.sh then run apps/services).

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -d "tests/e2e" ]; then
  echo "No tests/e2e folder yet. Add tests when ready."
  exit 0
fi

echo "Running E2E tests..."
if [ -f "tests/e2e/package.json" ]; then
  (cd tests/e2e && npm ci && npm test)
else
  echo "No test runner found in tests/e2e. Add package.json (e.g. Playwright, Cypress)."
  exit 0
fi
