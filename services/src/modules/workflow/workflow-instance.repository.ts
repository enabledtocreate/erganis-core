import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';
import {
  WorkflowInstanceStatus,
  WorkflowNodeLogEntry,
} from '@erganis/platform';

export interface WorkflowInstanceRow {
  id: string;
  workflowKey: string;
  orgId: string;
  entityPublicId: string | null;
  currentNodeId: string;
  status: WorkflowInstanceStatus;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class WorkflowInstanceRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async create(input: {
    workflowKey: string;
    orgId: string;
    entityPublicId?: string;
    currentNodeId: string;
    context?: Record<string, unknown>;
  }): Promise<WorkflowInstanceRow> {
    const row = await this.queryOne(
      `INSERT INTO platform.workflow_instances
         (workflow_key, org_id, entity_public_id, current_node_id, context)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, workflow_key, org_id, entity_public_id, current_node_id,
                 status, context, created_at, updated_at`,
      [
        input.workflowKey,
        input.orgId,
        input.entityPublicId ?? null,
        input.currentNodeId,
        JSON.stringify(input.context ?? {}),
      ],
      mapInstance,
    );
    if (!row) {
      throw new Error('Failed to create workflow instance');
    }
    return row;
  }

  async findById(id: string): Promise<WorkflowInstanceRow | null> {
    return this.queryOne(
      `SELECT id, workflow_key, org_id, entity_public_id, current_node_id,
              status, context, created_at, updated_at
       FROM platform.workflow_instances WHERE id = $1`,
      [id],
      mapInstance,
    );
  }

  async listActiveForOrg(orgId: string): Promise<WorkflowInstanceRow[]> {
    return this.queryMany(
      `SELECT id, workflow_key, org_id, entity_public_id, current_node_id,
              status, context, created_at, updated_at
       FROM platform.workflow_instances
       WHERE org_id = $1 AND status = 'active'
       ORDER BY updated_at DESC`,
      [orgId],
      mapInstance,
    );
  }

  async updateNode(
    id: string,
    currentNodeId: string,
    status: WorkflowInstanceStatus,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.execute(
      `UPDATE platform.workflow_instances
       SET current_node_id = $2, status = $3, context = $4::jsonb, updated_at = now()
       WHERE id = $1`,
      [id, currentNodeId, status, JSON.stringify(context)],
    );
  }

  async appendNodeLog(input: {
    instanceId: string;
    nodeId: string;
    title: string;
    actorPublicId?: string;
  }): Promise<void> {
    await this.execute(
      `INSERT INTO platform.workflow_node_log
         (instance_id, node_id, title, actor_public_id)
       VALUES ($1, $2, $3, $4)`,
      [input.instanceId, input.nodeId, input.title, input.actorPublicId ?? null],
    );
  }

  async closeNodeLog(instanceId: string, nodeId: string): Promise<void> {
    await this.execute(
      `UPDATE platform.workflow_node_log
       SET exited_at = now()
       WHERE instance_id = $1 AND node_id = $2 AND exited_at IS NULL`,
      [instanceId, nodeId],
    );
  }

  async getNodeLog(instanceId: string): Promise<WorkflowNodeLogEntry[]> {
    return this.queryMany(
      `SELECT node_id, title, entered_at, exited_at, actor_public_id
       FROM platform.workflow_node_log
       WHERE instance_id = $1
       ORDER BY entered_at`,
      [instanceId],
      (row) => ({
        nodeId: String(row.node_id),
        title: String(row.title),
        enteredAt: String(row.entered_at),
        exitedAt: row.exited_at ? String(row.exited_at) : null,
        actorPublicId: row.actor_public_id ? String(row.actor_public_id) : null,
      }),
    );
  }
}

function mapInstance(row: Record<string, unknown>): WorkflowInstanceRow {
  return {
    id: String(row.id),
    workflowKey: String(row.workflow_key),
    orgId: String(row.org_id),
    entityPublicId: row.entity_public_id ? String(row.entity_public_id) : null,
    currentNodeId: String(row.current_node_id),
    status: row.status as WorkflowInstanceStatus,
    context: (row.context ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
