-- Platform search FTS index (Core C9)
CREATE TABLE IF NOT EXISTS platform.search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_public_id TEXT NOT NULL,
  title TEXT,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, entity_type, entity_public_id)
);

CREATE INDEX IF NOT EXISTS idx_search_index_org ON platform.search_index (org_id);
CREATE INDEX IF NOT EXISTS idx_search_index_vector ON platform.search_index USING GIN (search_vector);
