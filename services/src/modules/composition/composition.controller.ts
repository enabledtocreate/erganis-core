import {
  Body,
  Controller,
  Get,
  Put,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import path from 'path';
import { SessionGuard } from '../auth/guards/session.guard';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { resolveContractsRoot } from './layout.validator';
import { ComponentSkinEntry, DesignTokens } from './theme-defaults';
import { ThemeResolutionService } from './theme-resolution.service';

const COMPOSITION_SCHEMAS = [
  {
    id: 'https://erganis.dev/schemas/composition/ui-layout.schema.json',
    file: 'schemas/composition/ui-layout.schema.json',
    description: 'Surface layout documents (*.layout.json)',
  },
  {
    id: 'https://erganis.dev/schemas/composition/theme.schema.json',
    file: 'schemas/composition/theme.schema.json',
    description: 'Resolved theme (GET /composition/theme)',
  },
  {
    id: 'https://erganis.dev/schemas/composition/slot-registry.schema.json',
    file: 'schemas/composition/slot-registry.schema.json',
    description: 'Platform slot registry',
  },
];

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

  @Get('schemas')
  async listSchemas() {
    const root = resolveContractsRoot();
    const schemas = await Promise.all(
      COMPOSITION_SCHEMAS.map(async (entry) => {
        const schemaPath = path.join(root, entry.file);
        const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
        return {
          id: entry.id,
          path: entry.file,
          description: entry.description,
          schema,
        };
      }),
    );
    return { schemas };
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
