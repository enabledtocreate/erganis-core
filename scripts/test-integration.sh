#!/usr/bin/env bash
# Run cross-repo integration tests (parent repo).
# Requires full platform: git submodule update --init --recursive

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -d "tests/integration" ]; then
  echo "No tests/integration folder yet. Add tests when ready."
  exit 0
fi

echo "Running integration tests..."
# When integration tests exist, run them (e.g. npm test in tests/integration, or pytest, etc.)
if [ -f "tests/integration/package.json" ]; then
  (cd tests/integration && npm ci && npm test)
elif [ -f "tests/integration/requirements.txt" ]; then
  (cd tests/integration && pip install -r requirements.txt && pytest)
else
  echo "No test runner found in tests/integration. Add package.json or requirements.txt."
  exit 0
fi
