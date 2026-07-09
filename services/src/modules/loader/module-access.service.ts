import { ForbiddenException, Injectable } from '@nestjs/common';
import { OrgModuleRepository } from '../loader/org-module.repository';
import { resolveStepsForOperation } from '@erganis/platform';
import { ModuleLoaderService } from '../loader/module-loader.service';

@Injectable()
export class ModuleAccessService {
  constructor(
    private readonly orgModules: OrgModuleRepository,
    private readonly loader: ModuleLoaderService,
  ) {}

  async isModuleEnabledForOrg(orgId: string, moduleId: string): Promise<boolean> {
    const mod = this.loader.getEnabledModules().find((m) => m.manifest.id === moduleId);
    const defaultEnabled = mod?.manifest.shipByDefault !== false;
    const setting = await this.orgModules.getSetting(orgId, moduleId);
    return setting?.enabled ?? defaultEnabled;
  }

  async assertOperationAllowed(
    orgId: string,
    surfaceId: string,
    action: string,
  ): Promise<void> {
    const modules = this.loader.getEnabledModules().map((m) => ({
      id: m.manifest.id,
      operations: m.operations,
    }));
    const steps = resolveStepsForOperation(surfaceId, action as never, modules);
    if (steps.length === 0) {
      return;
    }

    for (const step of steps) {
      const enabled = await this.isModuleEnabledForOrg(orgId, step.moduleId);
      if (!enabled) {
        throw new ForbiddenException({
          code: 'MODULE_DISABLED',
          message: `Module ${step.moduleId} is disabled for this organization`,
          moduleId: step.moduleId,
        });
      }
      const opDisabled = await this.orgModules.isOperationDisabled(
        orgId,
        step.moduleId,
        step.stepId,
      );
      if (opDisabled) {
        throw new ForbiddenException({
          code: 'OPERATION_DISABLED',
          message: `Operation step ${step.stepId} is disabled for module ${step.moduleId}`,
          moduleId: step.moduleId,
          stepId: step.stepId,
        });
      }
    }
  }
}
