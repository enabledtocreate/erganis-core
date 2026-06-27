import {
  OperationEnvelope,
  OperationOutcome,
  OperationStepSpec,
} from './operation-envelope';
import { stepHandlerKey } from './step-handler';

export function createOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Resolve operation steps from manifest contributions for a surface + action. */
export function resolveStepsForOperation(
  surfaceId: string,
  action: OperationEnvelope['action'],
  modules: Array<{
    id: string;
    operations: Array<{
      surfaceId: string;
      action: OperationEnvelope['action'];
      stepId: string;
      handler: string;
      failureClass: OperationStepSpec['failureClass'];
      phase?: OperationStepSpec['phase'];
    }>;
  }>,
): OperationStepSpec[] {
  const steps: OperationStepSpec[] = [];
  for (const mod of modules) {
    for (const op of mod.operations) {
      if (op.surfaceId === surfaceId && op.action === action) {
        steps.push({
          moduleId: mod.id,
          stepId: op.stepId,
          handler: op.handler,
          failureClass: op.failureClass,
          phase: op.phase ?? 'db',
        });
      }
    }
  }
  return steps;
}

export function computeOutcome(
  stepResults: Array<{ status: string; failureClass: OperationStepSpec['failureClass'] }>,
): OperationOutcome {
  const requiredFailed = stepResults.some(
    (s) => s.failureClass === 'required' && s.status === 'failed',
  );
  if (requiredFailed) {
    return 'failed';
  }
  const hasWarning = stepResults.some((s) => s.status === 'warning');
  if (hasWarning) {
    return 'partial';
  }
  return 'success';
}

export function assertHandlersRegistered(
  steps: OperationStepSpec[],
  registry: Set<string>,
): void {
  for (const step of steps) {
    const key = stepHandlerKey(step.moduleId, step.handler);
    if (!registry.has(key)) {
      throw new Error(`Step handler not registered: ${key}`);
    }
  }
}
