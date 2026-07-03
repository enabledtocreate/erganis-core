import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';
import { ComponentSkinEntry, DesignTokens } from './theme-defaults';

export interface OrgThemeRecord {
  orgId: string;
  designTokens: Partial<DesignTokens>;
  componentSkins: ComponentSkinEntry[];
}

@Injectable()
export class OrgThemeRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async findByOrgId(orgId: string): Promise<OrgThemeRecord | null> {
    return this.queryOne(
      `SELECT org_id, design_tokens, component_skins
       FROM platform.org_themes WHERE org_id = $1`,
      [orgId],
      (row) => ({
        orgId: String(row.org_id),
        designTokens: (row.design_tokens ?? {}) as Partial<DesignTokens>,
        componentSkins: (row.component_skins ?? []) as ComponentSkinEntry[],
      }),
    );
  }

  async upsert(orgId: string, designTokens: Partial<DesignTokens>, componentSkins: ComponentSkinEntry[]): Promise<void> {
    await this.execute(
      `INSERT INTO platform.org_themes (org_id, design_tokens, component_skins, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, now())
       ON CONFLICT (org_id)
       DO UPDATE SET
         design_tokens = EXCLUDED.design_tokens,
         component_skins = EXCLUDED.component_skins,
         updated_at = now()`,
      [orgId, JSON.stringify(designTokens), JSON.stringify(componentSkins)],
    );
  }
}
