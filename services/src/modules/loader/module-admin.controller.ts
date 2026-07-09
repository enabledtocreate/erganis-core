import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { OrgModuleRepository } from './org-module.repository';

/** @deprecated Prefer POST /admin/:orgSlug/modules/:moduleId */
@Controller('admin/modules')
@UseGuards(SessionGuard)
export class ModuleAdminController {
  constructor(private readonly orgModules: OrgModuleRepository) {}

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
