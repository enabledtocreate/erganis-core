-- Platform module registry (Phase 2)
CREATE TABLE IF NOT EXISTS platform.enabled_modules (
  module_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  installed_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.module_migrations (
  module_id TEXT NOT NULL,
  version TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (module_id, version)
);
