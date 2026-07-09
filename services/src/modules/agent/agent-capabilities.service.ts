import { Injectable } from '@nestjs/common';
import {
  AgentCapabilitiesResponse,
  AgentSchemaRef,
  AgentSurfaceCapability,
} from '@erganis/platform';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { ModuleLoaderService } from '../loader/module-loader.service';
import { OrgModuleRepository } from '../loader/org-module.repository';
import { ModuleAccessService } from '../loader/module-access.service';

const PLATFORM_SCHEMA_REFS: AgentSchemaRef[] = [
  {
    id: 'https://erganis.dev/schemas/envelope/operation-envelope.json',
    path: 'schemas/envelope/operation-envelope.schema.json',
    description: 'Operation envelope for POST /operations/execute',
  },
  {
    id: 'https://erganis.dev/schemas/composition/ui-layout.schema.json',
    path: 'schemas/composition/ui-layout.schema.json',
    description: 'Module surface layout documents',
  },
  {
    id: 'https://erganis.dev/schemas/composition/theme.schema.json',
    path: 'schemas/composition/theme.schema.json',
    description: 'Resolved theme (GET /composition/theme)',
  },
  {
    id: 'https://erganis.dev/schemas/composition/slot-registry.schema.json',
    path: 'schemas/composition/slot-registry.schema.json',
    description: 'Platform slot registry',
  },
];

@Injectable()
export class AgentCapabilitiesService {
  constructor(
    private readonly loader: ModuleLoaderService,
    private readonly orgs: OrgRepository,
    private readonly orgModules: OrgModuleRepository,
    private readonly moduleAccess: ModuleAccessService,
  ) {}

  async buildCapabilities(orgSlug: string): Promise<AgentCapabilitiesResponse> {
    const org = await this.orgs.findBySlug(orgSlug);
    const surfaceMap = new Map<string, AgentSurfaceCapability>();

    for (const mod of this.loader.getEnabledModules()) {
      if (org) {
        const enabled = await this.moduleAccess.isModuleEnabledForOrg(org.id, mod.manifest.id);
        if (!enabled) {
          continue;
        }
      }

      for (const op of mod.operations) {
        const disabled =
          org &&
          (await this.orgModules.isOperationDisabled(org.id, mod.manifest.id, op.stepId));
        if (disabled) {
          continue;
        }

        let surface = surfaceMap.get(op.surfaceId);
        if (!surface) {
          surface = {
            surfaceId: op.surfaceId,
            actions: [],
            operations: [],
          };
          surfaceMap.set(op.surfaceId, surface);
        }
        if (!surface.actions.includes(op.action)) {
          surface.actions.push(op.action);
        }
        surface.operations.push({
          moduleId: mod.manifest.id,
          surfaceId: op.surfaceId,
          action: op.action,
          stepId: op.stepId,
          handler: op.handler,
          failureClass: op.failureClass,
          phase: op.phase,
        });
      }

      const layouts = mod.manifest.contributions?.layout ?? [];
      const ui = mod.manifest.contributions?.ui ?? [];
      for (const layout of layouts) {
        let surface = surfaceMap.get(layout.surfaceId);
        if (!surface) {
          surface = {
            surfaceId: layout.surfaceId,
            actions: [],
            operations: [],
          };
          surfaceMap.set(layout.surfaceId, surface);
        }
        surface.layoutPaths = surface.layoutPaths ?? [];
        if (!surface.layoutPaths.includes(layout.path)) {
          surface.layoutPaths.push(layout.path);
        }
      }
      if (ui.length > 0 && surfaceMap.size > 0) {
        for (const surface of surfaceMap.values()) {
          if (surface.operations.some((o) => o.moduleId === mod.manifest.id)) {
            surface.uiSlots = ui.map((entry) => ({
              slot: entry.slot,
              component: entry.component,
            }));
          }
        }
      }
    }

    return {
      orgSlug,
      generatedAt: new Date().toISOString(),
      surfaces: [...surfaceMap.values()].sort((a, b) =>
        a.surfaceId.localeCompare(b.surfaceId),
      ),
      schemas: PLATFORM_SCHEMA_REFS,
      endpoints: {
        execute: 'POST /operations/execute',
        surfaceLoad: 'GET /surfaces/:surfaceId/load?orgSlug=',
        capabilities: 'GET /agent/capabilities?orgSlug=',
      },
    };
  }
}
