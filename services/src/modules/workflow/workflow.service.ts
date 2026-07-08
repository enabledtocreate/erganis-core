import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WorkflowDefinitionBody,
  WorkflowInstanceRecord,
  WorkflowNodeDefinition,
} from '@erganis/platform';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import {
  WorkflowDefinitionRecord,
  WorkflowDefinitionRepository,
} from './workflow-definition.repository';
import { WorkflowInstanceRepository } from './workflow-instance.repository';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly definitions: WorkflowDefinitionRepository,
    private readonly instances: WorkflowInstanceRepository,
    private readonly orgs: OrgRepository,
  ) {}

  async listDefinitions(orgSlug: string) {
    const org = orgSlug ? await this.orgs.findBySlug(orgSlug) : null;
    const rows = await this.definitions.listForOrg(org?.id ?? null);
    return {
      orgSlug,
      definitions: rows.map((row) => this.toDefinitionDto(row)),
    };
  }

  async getDefinition(orgSlug: string, workflowKey: string, version = '1.0.0') {
    const org = orgSlug ? await this.orgs.findBySlug(orgSlug) : null;
    const row = await this.definitions.findByKey(workflowKey, version, org?.id ?? null);
    if (!row) {
      throw new NotFoundException({
        code: 'WORKFLOW_NOT_FOUND',
        message: `Workflow ${workflowKey}@${version} not found`,
      });
    }
    return { orgSlug, definition: this.toDefinitionDto(row) };
  }

  async startInstance(input: {
    orgSlug: string;
    workflowKey: string;
    version?: string;
    entityPublicId?: string;
    context?: Record<string, unknown>;
  }): Promise<{ instance: WorkflowInstanceRecord }> {
    const org = await this.orgs.findBySlug(input.orgSlug);
    if (!org) {
      throw new NotFoundException({
        code: 'ORG_NOT_FOUND',
        message: `Org ${input.orgSlug} not found`,
      });
    }

    const def = await this.definitions.findByKey(
      input.workflowKey,
      input.version ?? '1.0.0',
      org.id,
    );
    if (!def) {
      throw new NotFoundException({
        code: 'WORKFLOW_NOT_FOUND',
        message: `Workflow ${input.workflowKey} not found`,
      });
    }

    const firstNode = def.definition.nodes[0];
    if (!firstNode) {
      throw new NotFoundException({
        code: 'WORKFLOW_EMPTY',
        message: `Workflow ${input.workflowKey} has no nodes`,
      });
    }

    const row = await this.instances.create({
      workflowKey: def.workflowKey,
      orgId: org.id,
      entityPublicId: input.entityPublicId,
      currentNodeId: firstNode.nodeId,
      context: input.context,
    });
    await this.instances.appendNodeLog({
      instanceId: row.id,
      nodeId: firstNode.nodeId,
      title: firstNode.title,
    });

    return { instance: await this.toInstanceRecord(row.id, def.definition) };
  }

  async getInstance(instanceId: string): Promise<{ instance: WorkflowInstanceRecord; log: unknown[] }> {
    const row = await this.instances.findById(instanceId);
    if (!row) {
      throw new NotFoundException({
        code: 'INSTANCE_NOT_FOUND',
        message: `Workflow instance ${instanceId} not found`,
      });
    }
    const def = await this.definitions.findByKey(row.workflowKey, '1.0.0', row.orgId);
    const log = await this.instances.getNodeLog(instanceId);
    return {
      instance: await this.toInstanceRecord(instanceId, def?.definition),
      log,
    };
  }

  async advanceInstance(
    instanceId: string,
    actorPublicId?: string,
  ): Promise<{ instance: WorkflowInstanceRecord }> {
    const row = await this.instances.findById(instanceId);
    if (!row || row.status !== 'active') {
      throw new NotFoundException({
        code: 'INSTANCE_NOT_FOUND',
        message: `Active workflow instance ${instanceId} not found`,
      });
    }

    const def = await this.definitions.findByKey(row.workflowKey, '1.0.0', row.orgId);
    if (!def) {
      throw new NotFoundException({
        code: 'WORKFLOW_NOT_FOUND',
        message: `Workflow ${row.workflowKey} not found`,
      });
    }

    const nextNodeId = this.resolveNextNode(def.definition, row.currentNodeId);
    await this.instances.closeNodeLog(instanceId, row.currentNodeId);

    if (!nextNodeId) {
      await this.instances.updateNode(instanceId, row.currentNodeId, 'completed', row.context);
      const updated = await this.instances.findById(instanceId);
      return {
        instance: await this.toInstanceRecord(instanceId, def.definition, updated!),
      };
    }

    const nextNode = def.definition.nodes.find((n) => n.nodeId === nextNodeId)!;
    await this.instances.updateNode(instanceId, nextNodeId, 'active', row.context);
    await this.instances.appendNodeLog({
      instanceId,
      nodeId: nextNode.nodeId,
      title: nextNode.title,
      actorPublicId,
    });

    return { instance: await this.toInstanceRecord(instanceId, def.definition) };
  }

  async handleOperationCompleted(payload: Record<string, unknown>): Promise<void> {
    const orgId = payload.orgId ? String(payload.orgId) : undefined;
    const outcome = payload.outcome ? String(payload.outcome) : undefined;
    if (!orgId || outcome !== 'success') {
      return;
    }

    const surfaceId = payload.surfaceId ? String(payload.surfaceId) : '';
    const action = payload.action ? String(payload.action) : '';
    const triggerCandidates = [
      `${surfaceId}.${action}`,
      action,
    ].filter(Boolean);

    const active = await this.instances.listActiveForOrg(orgId);
    for (const instance of active) {
      const def = await this.definitions.findByKey(
        instance.workflowKey,
        '1.0.0',
        instance.orgId,
      );
      if (!def) {
        continue;
      }

      const current = def.definition.nodes.find(
        (n) => n.nodeId === instance.currentNodeId,
      );
      if (!current?.trigger) {
        continue;
      }
      if (!triggerCandidates.includes(current.trigger)) {
        continue;
      }

      await this.advanceInstance(instance.id);
    }
  }

  private resolveNextNode(
    definition: WorkflowDefinitionBody,
    currentNodeId: string,
  ): string | null {
    const edge = definition.edges?.find((e) => e.from === currentNodeId);
    return edge?.to ?? null;
  }

  private nodeTitle(
    definition: WorkflowDefinitionBody | undefined,
    nodeId: string,
  ): string {
    const node = definition?.nodes.find((n) => n.nodeId === nodeId);
    return node?.title ?? nodeId;
  }

  private async toInstanceRecord(
    instanceId: string,
    definition?: WorkflowDefinitionBody,
    rowOverride?: Awaited<ReturnType<WorkflowInstanceRepository['findById']>>,
  ): Promise<WorkflowInstanceRecord> {
    const row = rowOverride ?? (await this.instances.findById(instanceId));
    if (!row) {
      throw new NotFoundException({
        code: 'INSTANCE_NOT_FOUND',
        message: `Workflow instance ${instanceId} not found`,
      });
    }
    return {
      id: row.id,
      workflowKey: row.workflowKey,
      orgId: row.orgId,
      entityPublicId: row.entityPublicId,
      currentNodeId: row.currentNodeId,
      currentNodeTitle: this.nodeTitle(definition, row.currentNodeId),
      status: row.status,
      context: row.context,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDefinitionDto(row: WorkflowDefinitionRecord) {
    return {
      workflowKey: row.workflowKey,
      title: row.title,
      version: row.version,
      nodes: row.definition.nodes,
      edges: row.definition.edges ?? [],
      orgScoped: row.orgId !== null,
    };
  }
}

export type { WorkflowNodeDefinition };
