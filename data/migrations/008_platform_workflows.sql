-- Workflow definitions and pipeline state (Core C14)

CREATE TABLE IF NOT EXISTS platform.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  definition JSONB NOT NULL,
  org_id UUID REFERENCES platform.orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (workflow_key, version, org_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_key
  ON platform.workflow_definitions (workflow_key);

CREATE TABLE IF NOT EXISTS platform.workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_key TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES platform.orgs(id) ON DELETE CASCADE,
  entity_public_id TEXT,
  current_node_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_org_entity
  ON platform.workflow_instances (org_id, entity_public_id);

CREATE TABLE IF NOT EXISTS platform.workflow_node_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES platform.workflow_instances(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  actor_public_id TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_node_log_instance
  ON platform.workflow_node_log (instance_id, entered_at);

-- Platform default: drawing approval pipeline (Build use case)
INSERT INTO platform.workflow_definitions (workflow_key, title, version, definition, org_id)
SELECT
  'build.drawing-approval',
  'Drawing set approval',
  '1.0.0',
  '{
    "workflowKey": "build.drawing-approval",
    "title": "Drawing set approval",
    "version": "1.0.0",
    "nodes": [
      { "nodeId": "submit", "title": "Designer submit", "trigger": "build.drawing.submit" },
      { "nodeId": "review", "title": "Principal review", "trigger": "build.drawing.review" },
      { "nodeId": "client", "title": "Client approval", "trigger": "build.drawing.client-approve" }
    ],
    "edges": [
      { "from": "submit", "to": "review" },
      { "from": "review", "to": "client" }
    ]
  }'::jsonb,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM platform.workflow_definitions
  WHERE workflow_key = 'build.drawing-approval' AND version = '1.0.0' AND org_id IS NULL
);
