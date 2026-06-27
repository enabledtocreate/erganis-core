import { DbUnitOfWork } from '../dal/unit-of-work';
import { OperationContext } from './operation-context';

export interface StepHandlerResult {
  message?: string;
  data?: Record<string, unknown>;
}

/** Module step handler — receives orchestrator-managed unit of work for `phase: db` steps. */
export type StepHandler = (
  context: OperationContext,
  unitOfWork: DbUnitOfWork,
  payload: Record<string, unknown>,
) => Promise<StepHandlerResult>;

export type StepHandlerRegistry = Map<string, StepHandler>;

/** Build registry key: `{moduleId}:{handlerName}` */
export function stepHandlerKey(moduleId: string, handlerName: string): string {
  return `${moduleId}:${handlerName}`;
}
