import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PgUnitOfWorkFactory } from '@erganis/dal-postgres';
import {
  LOCKABLE_ACTIONS,
  OperationContext,
  OperationEnvelope,
  OperationResult,
  OperationStepResult,
  OperationWarning,
  StepFailureClass,
  computeOutcome,
  createOperationId,
  resolveStepsForOperation,
  stepHandlerKey,
} from '@erganis/platform';
import { DatabaseService } from '../database/database.service';
import { ModuleLoaderService } from '../loader/module-loader.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { UserRepository } from '../auth/infrastructure/user.repository';
import { EntityLockService } from './application/entity-lock.service';
import { ModuleAccessService } from '../loader/module-access.service';
import { PlatformEventService } from '../platform-services/platform-event.service';

export interface ExecuteOperationInput {
  envelope: OperationEnvelope;
  userId: string;
  userPublicId: string;
}

@Injectable()
export class OrchestratorService {
  private unitOfWorkFactory: PgUnitOfWorkFactory | null = null;

  constructor(
    private readonly database: DatabaseService,
    private readonly loader: ModuleLoaderService,
    private readonly orgs: OrgRepository,
    private readonly users: UserRepository,
    private readonly entityLock: EntityLockService,
    private readonly moduleAccess: ModuleAccessService,
    private readonly platformEvents: PlatformEventService,
  ) {}

  async execute(input: ExecuteOperationInput): Promise<OperationResult> {
    const pool = this.database.getPool();
    if (!pool) {
      throw new Error('DATABASE_URL is required for orchestrator');
    }
    if (!this.unitOfWorkFactory) {
      this.unitOfWorkFactory = new PgUnitOfWorkFactory(pool);
    }

    const org = await this.orgs.findBySlug(input.envelope.orgSlug);
    if (!org) {
      throw new UnprocessableEntityException('Organization not found');
    }

    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UnprocessableEntityException('User not found');
    }

    const operationId = input.envelope.operationId ?? createOperationId();
    const context: OperationContext = {
      operationId,
      orgId: org.id,
      orgPublicId: org.publicId,
      orgSlug: org.slug,
      userId: user.id,
      userPublicId: user.publicId,
      surfaceId: input.envelope.surfaceId,
      action: input.envelope.action,
      entityPublicId: input.envelope.entityPublicId,
      entityVersion: input.envelope.entityVersion,
      initiatedAt: new Date().toISOString(),
    };

    const modules = this.loader.getEnabledModules().map((m) => ({
      id: m.manifest.id,
      operations: m.operations,
    }));
    const steps = resolveStepsForOperation(
      input.envelope.surfaceId,
      input.envelope.action,
      modules,
    );
    if (steps.length === 0) {
      throw new UnprocessableEntityException(
        `No operation steps registered for ${input.envelope.surfaceId}.${input.envelope.action}`,
      );
    }

    await this.moduleAccess.assertOperationAllowed(
      org.id,
      input.envelope.surfaceId,
      input.envelope.action,
    );

    const usesEntityLock =
      Boolean(input.envelope.entityPublicId) &&
      LOCKABLE_ACTIONS.has(input.envelope.action);

    const handlers = this.loader.getHandlers();
    const stepResults: OperationStepResult[] = [];
    const outcomeInputs: Array<{
      status: OperationStepResult['status'];
      failureClass: (typeof steps)[0]['failureClass'];
    }> = [];
    const warnings: OperationWarning[] = [];

    let entityVersion: number | undefined;

    try {
      if (usesEntityLock) {
        await this.entityLock.assertVersion(
          org.id,
          input.envelope.entityPublicId,
          input.envelope.entityVersion,
        );
        await this.entityLock.acquireLock(
          org.id,
          input.envelope.entityPublicId,
          operationId,
          user.id,
        );
      }

      const dbSteps = steps.filter((s) => s.phase === 'db');
      const postCommitSteps = steps.filter((s) => s.phase === 'post_commit');

      if (dbSteps.length > 0) {
        await this.unitOfWorkFactory.runInTransaction(async (unitOfWork) => {
          for (const step of dbSteps) {
            const result = await this.runStep(
              step,
              context,
              input.envelope.payload,
              handlers,
              unitOfWork,
            );
            stepResults.push(result);
            outcomeInputs.push({
              status: result.status,
              failureClass: step.failureClass,
            });
            if (result.status === 'warning') {
              warnings.push({
                moduleId: step.moduleId,
                stepId: step.stepId,
                message: result.message ?? 'Step warning',
                code: result.code,
              });
            }
            if (result.status === 'failed' && step.failureClass === 'required') {
              throw new Error(result.message ?? 'Required step failed');
            }
          }
        });
      }

      for (const step of postCommitSteps) {
        const result = await this.runStep(
          step,
          context,
          input.envelope.payload,
          handlers,
        );
        stepResults.push(result);
        outcomeInputs.push({ status: result.status, failureClass: step.failureClass });
        if (result.status === 'warning' || result.status === 'failed') {
          warnings.push({
            moduleId: step.moduleId,
            stepId: step.stepId,
            message: result.message ?? 'Step warning',
            code: result.code,
          });
        }
      }

      const outcome = computeOutcome(outcomeInputs);

      if (outcome === 'failed') {
        throw new UnprocessableEntityException({
          operationId,
          outcome,
          surfaceId: input.envelope.surfaceId,
          action: input.envelope.action,
          steps: stepResults,
          warnings,
        });
      }

      if (usesEntityLock) {
        const bumped = await this.entityLock.bumpVersion(
          org.id,
          input.envelope.entityPublicId,
        );
        if (bumped !== null) {
          entityVersion = bumped;
        }
      }

      const result = {
        operationId,
        outcome,
        surfaceId: input.envelope.surfaceId,
        action: input.envelope.action,
        steps: stepResults,
        warnings,
        entityVersion,
      };

      await this.platformEvents.recordOperation({
        result,
        orgId: org.id,
        userId: user.id,
      });

      return result;
    } finally {
      if (usesEntityLock) {
        await this.entityLock.releaseLock(
          org.id,
          input.envelope.entityPublicId,
          operationId,
        );
      }
    }
  }

  private async runStep(
    step: {
      moduleId: string;
      stepId: string;
      handler: string;
      failureClass: StepFailureClass;
    },
    context: OperationContext,
    payload: Record<string, unknown>,
    handlers: Map<string, import('@erganis/platform').StepHandler>,
    unitOfWork?: import('@erganis/platform').DbUnitOfWork,
  ): Promise<OperationStepResult> {
    const key = stepHandlerKey(step.moduleId, step.handler);
    const handler = handlers.get(key);
    if (!handler) {
      return this.stepResult(step, 'failed', step.handler, {
        message: `Handler not registered: ${key}`,
        code: 'HANDLER_NOT_FOUND',
        failureClass: step.failureClass,
      });
    }

    try {
      const uow =
        unitOfWork ??
        ({
          client: { query: async () => ({ rows: [], rowCount: 0 }) },
          commit: async () => undefined,
          rollback: async () => undefined,
        } as import('@erganis/platform').DbUnitOfWork);

      const result = await handler(context, uow, payload);
      return {
        moduleId: step.moduleId,
        stepId: step.stepId,
        handler: step.handler,
        status: 'success',
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Step failed';
      return this.stepResult(step, 'failed', step.handler, {
        message,
        code: 'STEP_FAILED',
        failureClass: step.failureClass,
      });
    }
  }

  private stepResult(
    step: { moduleId: string; stepId: string; handler: string },
    status: OperationStepResult['status'],
    handler: string,
    input: {
      message?: string;
      code?: string;
      failureClass: StepFailureClass;
    },
  ): OperationStepResult {
    if (input.failureClass === 'advisory' && status === 'failed') {
      return {
        moduleId: step.moduleId,
        stepId: step.stepId,
        handler,
        status: 'warning',
        message: input.message,
        code: input.code,
      };
    }
    return {
      moduleId: step.moduleId,
      stepId: step.stepId,
      handler,
      status,
      message: input.message,
      code: input.code,
    };
  }
}

