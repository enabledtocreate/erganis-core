import { Injectable, NotFoundException } from '@nestjs/common';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { MembershipRepository } from '../auth/infrastructure/membership.repository';
import { ModuleLoaderService } from '../loader/module-loader.service';
import { OrgModuleRepository } from '../loader/org-module.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly orgs: OrgRepository,
    private readonly memberships: MembershipRepository,
    private readonly loader: ModuleLoaderService,
    private readonly orgModules: OrgModuleRepository,
  ) {}

  async getOrganization(orgSlug: string) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return {
      publicId: org.publicId,
      slug: org.slug,
      name: org.name,
      allowedDomains: org.allowedDomains,
      authMode: org.authMode,
    };
  }

  async listUsers(orgSlug: string) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const members = await this.memberships.listMembers(org.id);
    return { users: members };
  }

  async listRoles(orgSlug: string) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const roles = await this.orgs.listRoles(org.id);
    return {
      roles: roles.map((role) => ({
        name: role.name,
        permissions: role.permissions,
        isAdmin: role.isAdmin,
      })),
    };
  }

  async listModules(orgSlug: string) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const settings = await this.orgModules.listSettings(org.id);
    const settingsByModule = new Map(settings.map((s) => [s.moduleId, s]));

    const modules = this.loader.getEnabledModules().map((mod) => {
      const setting = settingsByModule.get(mod.manifest.id);
      const shipByDefault = mod.manifest.shipByDefault !== false;
      const enabled = setting?.enabled ?? shipByDefault;
      return {
        moduleId: mod.manifest.id,
        name: mod.manifest.name,
        version: mod.manifest.version,
        description: mod.manifest.description ?? null,
        shipByDefault,
        enabled,
        operations: mod.operations.map((op) => ({
          surfaceId: op.surfaceId,
          action: op.action,
          stepId: op.stepId,
          handler: op.handler,
          phase: op.phase ?? 'db',
        })),
      };
    });

    return {
      modules,
      moduleRegistryUrl: 'https://github.com/enabledtocreate/erganis-modules',
      moduleRegistryNote: 'Future: install modules from the Erganis module registry.',
    };
  }

  async setModuleEnabled(orgSlug: string, moduleId: string, enabled: boolean) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const installed = this.loader
      .getEnabledModules()
      .some((mod) => mod.manifest.id === moduleId);
    if (!installed) {
      throw new NotFoundException(`Module ${moduleId} is not installed on this Core instance`);
    }
    await this.orgModules.setEnabled(org.id, moduleId, enabled);
    return { ok: true, moduleId, enabled };
  }

  async isModuleEnabled(orgSlug: string, moduleId: string): Promise<boolean> {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      return false;
    }
    const mod = this.loader.getEnabledModules().find((m) => m.manifest.id === moduleId);
    if (!mod) {
      return false;
    }
    const shipByDefault = mod.manifest.shipByDefault !== false;
    const setting = await this.orgModules.getSetting(org.id, moduleId);
    return setting?.enabled ?? shipByDefault;
  }
}
