import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';
import { WorkflowDefinitionBody } from '@erganis/platform';

export interface WorkflowDefinitionRecord {
  id: string;
  workflowKey: string;
  title: string;
  version: string;
  definition: WorkflowDefinitionBody;
  orgId: string | null;
  createdAt: string;
}

@Injectable()
export class WorkflowDefinitionRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async listForOrg(orgId: string | null): Promise<WorkflowDefinitionRecord[]> {
    return this.queryMany(
      `SELECT id, workflow_key, title, version, definition, org_id, created_at
       FROM platform.workflow_definitions
       WHERE org_id IS NULL OR org_id = $1
       ORDER BY workflow_key, version`,
      [orgId],
      mapDefinition,
    );
  }

  async findByKey(
    workflowKey: string,
    version: string,
    orgId: string | null,
  ): Promise<WorkflowDefinitionRecord | null> {
    return this.queryOne(
      `SELECT id, workflow_key, title, version, definition, org_id, created_at
       FROM platform.workflow_definitions
       WHERE workflow_key = $1 AND version = $2
         AND (org_id IS NULL OR org_id = $3)
       ORDER BY org_id NULLS LAST
       LIMIT 1`,
      [workflowKey, version, orgId],
      mapDefinition,
    );
  }
}

function mapDefinition(row: Record<string, unknown>): WorkflowDefinitionRecord {
  return {
    id: String(row.id),
    workflowKey: String(row.workflow_key),
    title: String(row.title),
    version: String(row.version),
    definition: row.definition as WorkflowDefinitionBody,
    orgId: row.org_id ? String(row.org_id) : null,
    createdAt: String(row.created_at),
  };
}
