-- Entity versioning and workflow locks (Core C3)
CREATE TABLE IF NOT EXISTS platform.entity_versions (
  org_id UUID NOT NULL,
  entity_public_id TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, entity_public_id)
);

CREATE TABLE IF NOT EXISTS platform.entity_locks (
  org_id UUID NOT NULL,
  entity_public_id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  locked_by_user_id UUID NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (org_id, entity_public_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_locks_expires ON platform.entity_locks (expires_at);
