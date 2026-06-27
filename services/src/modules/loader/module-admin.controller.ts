import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { OrgModuleRepository } from './org-module.repository';
import { ModuleLoaderService } from './module-loader.service';

@Controller('admin/modules')
@UseGuards(SessionGuard)
export class ModuleAdminController {
  constructor(
    private readonly orgModules: OrgModuleRepository,
    private readonly loader: ModuleLoaderService,
  ) {}

  @Get(':orgId')
  listForOrg(@Param('orgId') orgId: string) {
    return this.loader.getEnabledModules().map((m) => ({
      moduleId: m.manifest.id,
      name: m.manifest.name,
      orgId,
    }));
  }

  @Post(':orgId/:moduleId/enable')
  async setEnabled(
    @Param('orgId') orgId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: { enabled: boolean },
  ) {
    await this.orgModules.setEnabled(orgId, moduleId, body.enabled ?? true);
    return { ok: true, orgId, moduleId, enabled: body.enabled ?? true };
  }
}
