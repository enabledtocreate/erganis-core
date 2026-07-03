-- Org theme overrides (Core C12)
CREATE TABLE IF NOT EXISTS platform.org_themes (
  org_id UUID PRIMARY KEY REFERENCES platform.orgs(id) ON DELETE CASCADE,
  design_tokens JSONB NOT NULL DEFAULT '{}',
  component_skins JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
