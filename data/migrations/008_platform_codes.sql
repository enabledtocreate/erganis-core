-- Building code rule packs (Core C13)
CREATE TABLE IF NOT EXISTS platform.code_rule_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_family TEXT NOT NULL CHECK (rule_family IN ('ibc', 'accessibility')),
  jurisdiction TEXT NOT NULL DEFAULT 'US',
  edition TEXT NOT NULL,
  topic TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  numeric_value NUMERIC,
  unit TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_family, jurisdiction, edition, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_code_rule_packs_lookup
  ON platform.code_rule_packs (rule_family, jurisdiction, edition, topic);

CREATE TABLE IF NOT EXISTS platform.code_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  edition TEXT,
  rules_imported INT NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
