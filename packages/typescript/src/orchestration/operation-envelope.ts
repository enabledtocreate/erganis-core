export type OperationAction =
  | 'load'
  | 'save'
  | 'draft'
  | 'archive'
  | 'approve'
  | 'sync';

export type StepFailureClass = 'required' | 'optional' | 'advisory';

export type StepPhase = 'db' | 'post_commit';

export type OperationOutcome = 'success' | 'partial' | 'failed';

export type StepStatus = 'success' | 'failed' | 'skipped' | 'warning';

export interface OperationStepSpec {
  moduleId: string;
  stepId: string;
  handler: string;
  failureClass: StepFailureClass;
  phase: StepPhase;
}

export interface OperationEnvelope {
  operationId?: string;
  surfaceId: string;
  action: OperationAction;
  orgSlug: string;
  entityPublicId?: string;
  entityVersion?: number;
  payload: Record<string, unknown>;
}

export interface OperationStepResult {
  moduleId: string;
  stepId: string;
  handler: string;
  status: StepStatus;
  message?: string;
  code?: string;
  data?: Record<string, unknown>;
}

export interface OperationWarning {
  moduleId: string;
  stepId: string;
  message: string;
  code?: string;
}

export interface OperationResult {
  operationId: string;
  outcome: OperationOutcome;
  surfaceId: string;
  action: OperationAction;
  steps: OperationStepResult[];
  warnings: OperationWarning[];
  /** Set when entityPublicId was locked and version bumped (C3). */
  entityVersion?: number;
}
