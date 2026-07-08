/** Workflow definition and pipeline state (Core C14). */

export interface WorkflowNodeDefinition {
  nodeId: string;
  title: string;
  trigger?: string;
  description?: string;
}

export interface WorkflowDefinitionBody {
  workflowKey: string;
  title: string;
  version: string;
  nodes: WorkflowNodeDefinition[];
  edges?: { from: string; to: string }[];
}

export type WorkflowInstanceStatus = 'active' | 'completed' | 'cancelled';

export interface WorkflowInstanceRecord {
  id: string;
  workflowKey: string;
  orgId: string;
  entityPublicId: string | null;
  currentNodeId: string;
  currentNodeTitle: string;
  status: WorkflowInstanceStatus;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNodeLogEntry {
  nodeId: string;
  title: string;
  enteredAt: string;
  exitedAt: string | null;
  actorPublicId: string | null;
}
