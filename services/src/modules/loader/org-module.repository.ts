import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

export interface OrgModuleSetting {
  orgId: string;
  moduleId: string;
  enabled: boolean;
  disabledOperations: string[];
}

@Injectable()
export class OrgModuleRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async getSetting(orgId: string, moduleId: string): Promise<OrgModuleSetting | null> {
    return this.queryOne(
      `SELECT org_id, module_id, enabled, disabled_operations
       FROM platform.org_module_settings
       WHERE org_id = $1 AND module_id = $2`,
      [orgId, moduleId],
      (row) => ({
        orgId: row.org_id as string,
        moduleId: row.module_id as string,
        enabled: row.enabled as boolean,
        disabledOperations: (row.disabled_operations as string[]) ?? [],
      }),
    );
  }

  async isModuleEnabled(orgId: string, moduleId: string): Promise<boolean> {
    const setting = await this.getSetting(orgId, moduleId);
    return setting?.enabled ?? true;
  }

  async isOperationDisabled(
    orgId: string,
    moduleId: string,
    stepId: string,
  ): Promise<boolean> {
    const setting = await this.getSetting(orgId, moduleId);
    if (setting && !setting.enabled) {
      return true;
    }
    return setting?.disabledOperations.includes(stepId) ?? false;
  }

  async setEnabled(orgId: string, moduleId: string, enabled: boolean): Promise<void> {
    await this.execute(
      `INSERT INTO platform.org_module_settings (org_id, module_id, enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, module_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         updated_at = now()`,
      [orgId, moduleId, enabled],
    );
  }
}
