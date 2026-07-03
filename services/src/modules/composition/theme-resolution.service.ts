import { Injectable } from '@nestjs/common';
import {
  ComponentSkinEntry,
  DEFAULT_COMPONENT_SKINS,
  DEFAULT_DESIGN_TOKENS,
  DesignTokens,
  mergeComponentSkins,
  mergeDesignTokens,
  ResolvedTheme,
} from './theme-defaults';
import { OrgThemeRepository } from './theme.repository';

@Injectable()
export class ThemeResolutionService {
  constructor(private readonly themes: OrgThemeRepository) {}

  async resolveForOrg(orgId: string): Promise<ResolvedTheme> {
    const orgTheme = await this.themes.findByOrgId(orgId);
    if (!orgTheme) {
      return this.resolvePlatform();
    }
    return this.resolve(orgTheme.designTokens, orgTheme.componentSkins, 'org');
  }

  resolvePlatform(): ResolvedTheme {
    return this.resolve(undefined, undefined, 'platform');
  }

  resolvePreview(draft: {
    designTokens?: Partial<DesignTokens>;
    componentSkins?: ComponentSkinEntry[];
  }): ResolvedTheme {
    return this.resolve(draft.designTokens, draft.componentSkins, 'preview');
  }

  async resolveWithOrgBase(
    orgId: string,
    draft: {
      designTokens?: Partial<DesignTokens>;
      componentSkins?: ComponentSkinEntry[];
    },
  ): Promise<ResolvedTheme> {
    const orgTheme = await this.themes.findByOrgId(orgId);
    const mergedTokens = mergeDesignTokens(
      mergeDesignTokens(DEFAULT_DESIGN_TOKENS, orgTheme?.designTokens),
      draft.designTokens,
    );
    const mergedSkins = mergeComponentSkins(
      mergeComponentSkins(DEFAULT_COMPONENT_SKINS, orgTheme?.componentSkins),
      draft.componentSkins,
    );
    return {
      designTokens: mergedTokens,
      componentSkins: mergedSkins,
      source: 'preview',
    };
  }

  async saveOrgTheme(
    orgId: string,
    designTokens: Partial<DesignTokens>,
    componentSkins: ComponentSkinEntry[],
  ): Promise<ResolvedTheme> {
    await this.themes.upsert(orgId, designTokens, componentSkins);
    return this.resolveForOrg(orgId);
  }

  private resolve(
    tokenOverride?: Partial<DesignTokens>,
    skinOverride?: ComponentSkinEntry[],
    source: ResolvedTheme['source'] = 'platform',
  ): ResolvedTheme {
    return {
      designTokens: mergeDesignTokens(DEFAULT_DESIGN_TOKENS, tokenOverride),
      componentSkins: mergeComponentSkins(DEFAULT_COMPONENT_SKINS, skinOverride),
      source: tokenOverride || skinOverride?.length ? source : 'platform',
    };
  }
}
