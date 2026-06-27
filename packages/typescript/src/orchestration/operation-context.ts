import { OperationAction } from './operation-envelope';

/** Runtime context injected into every orchestrator step handler. */
export interface OperationContext {
  operationId: string;
  orgId: string;
  orgPublicId: string;
  orgSlug: string;
  userId: string;
  userPublicId: string;
  surfaceId: string;
  action: OperationAction;
  entityPublicId?: string;
  entityVersion?: number;
  initiatedAt: string;
}
