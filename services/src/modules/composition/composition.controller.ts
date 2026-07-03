import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { ComponentSkinEntry, DesignTokens } from './theme-defaults';
import { ThemeResolutionService } from './theme-resolution.service';

const DEFAULT_SLOTS = [
  { slotId: 'shell.header', region: 'header', description: 'Top navigation bar' },
  { slotId: 'shell.sidebar', region: 'sidebar', description: 'Primary navigation' },
  { slotId: 'shell.main', region: 'main', description: 'Primary content area' },
  { slotId: 'dashboard.widget', region: 'dashboard', description: 'Dashboard widgets' },
];

@Controller('composition')
export class CompositionController {
  constructor(
    private readonly themes: ThemeResolutionService,
    private readonly orgs: OrgRepository,
  ) {}

  @Get('slots')
  listSlots() {
    return { slots: DEFAULT_SLOTS };
  }

  @Get('theme')
  @UseGuards(SessionGuard)
  async getTheme(@Query('orgSlug') orgSlug: string) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      return { orgSlug, theme: this.themes.resolvePlatform() };
    }
    const theme = await this.themes.resolveForOrg(org.id);
    return { orgSlug, theme };
  }

  @Post('theme/preview')
  @UseGuards(SessionGuard)
  async previewTheme(
    @Query('orgSlug') orgSlug: string,
    @Body()
    body: {
      designTokens?: Partial<DesignTokens>;
      componentSkins?: ComponentSkinEntry[];
    },
  ) {
    const org = await this.orgs.findBySlug(orgSlug);
    const theme = org
      ? await this.themes.resolveWithOrgBase(org.id, body ?? {})
      : this.themes.resolvePreview(body ?? {});
    return { orgSlug, theme };
  }

  @Put('theme')
  @UseGuards(SessionGuard)
  async saveTheme(
    @Query('orgSlug') orgSlug: string,
    @Body()
    body: {
      designTokens?: Partial<DesignTokens>;
      componentSkins?: ComponentSkinEntry[];
    },
  ) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      return { ok: false, orgSlug, error: 'ORG_NOT_FOUND' };
    }
    const theme = await this.themes.saveOrgTheme(
      org.id,
      body.designTokens ?? {},
      body.componentSkins ?? [],
    );
    return { ok: true, orgSlug, theme };
  }
}
