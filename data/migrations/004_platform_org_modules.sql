-- Per-org module enablement (Core C5)
CREATE TABLE IF NOT EXISTS platform.org_module_settings (
  org_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  disabled_operations JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_org_module_settings_org ON platform.org_module_settings (org_id);
