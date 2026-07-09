import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get(':orgSlug/organization')
  @UseGuards(SessionGuard, AdminGuard)
  getOrganization(@Param('orgSlug') orgSlug: string) {
    return this.admin.getOrganization(orgSlug);
  }

  @Get(':orgSlug/users')
  @UseGuards(SessionGuard, AdminGuard)
  listUsers(@Param('orgSlug') orgSlug: string) {
    return this.admin.listUsers(orgSlug);
  }

  @Get(':orgSlug/roles')
  @UseGuards(SessionGuard, AdminGuard)
  listRoles(@Param('orgSlug') orgSlug: string) {
    return this.admin.listRoles(orgSlug);
  }

  @Get(':orgSlug/modules')
  @UseGuards(SessionGuard, AdminGuard)
  listModules(@Param('orgSlug') orgSlug: string) {
    return this.admin.listModules(orgSlug);
  }

  @Post(':orgSlug/modules/:moduleId')
  @UseGuards(SessionGuard, AdminGuard)
  setModuleEnabled(
    @Param('orgSlug') orgSlug: string,
    @Param('moduleId') moduleId: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.admin.setModuleEnabled(orgSlug, moduleId, body.enabled ?? true);
  }
}
