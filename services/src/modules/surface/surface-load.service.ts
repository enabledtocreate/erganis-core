import { StepHandler, stepHandlerKey } from '@erganis/platform';
import { Injectable } from '@nestjs/common';
import { ModuleLoaderService } from '../loader/module-loader.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { ModuleAccessService } from '../loader/module-access.service';

@Injectable()
export class SurfaceLoadService {
  constructor(
    private readonly loader: ModuleLoaderService,
    private readonly orgs: OrgRepository,
    private readonly moduleAccess: ModuleAccessService,
  ) {}

  async loadSurface(orgSlug: string, surfaceId: string, payload: Record<string, unknown>) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new Error('Organization not found');
    }

    await this.moduleAccess.assertOperationAllowed(org.id, surfaceId, 'load');

    const modules = this.loader.getEnabledModules();
    const handlers = this.loader.getHandlers();
    const result: Record<string, unknown> = {};

    for (const mod of modules) {
      const loadOps = (mod.operations ?? []).filter(
        (op) => op.surfaceId === surfaceId && op.action === 'load',
      );
      if (loadOps.length === 0) {
        continue;
      }
      const moduleData: Record<string, unknown> = {};
      for (const op of loadOps) {
        const handler = handlers.get(stepHandlerKey(mod.manifest.id, op.handler));
        if (!handler) {
          continue;
        }
        const stepResult = await this.runLoadHandler(handler, org.id, org.publicId, orgSlug, surfaceId, payload);
        moduleData[op.stepId] = stepResult;
      }
      if (Object.keys(moduleData).length > 0) {
        result[mod.manifest.id] = moduleData;
      }
    }

    return { surfaceId, orgSlug, modules: result };
  }

  private async runLoadHandler(
    handler: StepHandler,
    orgId: string,
    orgPublicId: string,
    orgSlug: string,
    surfaceId: string,
    payload: Record<string, unknown>,
  ) {
    const noopUow = {
      client: { query: async () => ({ rows: [], rowCount: 0 }) },
      commit: async () => undefined,
      rollback: async () => undefined,
    };
    return handler(
      {
        operationId: `load_${Date.now()}`,
        orgId,
        orgPublicId,
        orgSlug,
        userId: '',
        userPublicId: '',
        surfaceId,
        action: 'load',
        initiatedAt: new Date().toISOString(),
      },
      noopUow,
      payload,
    );
  }
}
