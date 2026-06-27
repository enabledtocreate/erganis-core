import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

export interface EnabledModuleRecord {
  moduleId: string;
  enabled: boolean;
  installedVersion: string;
}

@Injectable()
export class ModuleRegistryRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async upsertEnabled(moduleId: string, version: string): Promise<void> {
    await this.execute(
      `INSERT INTO platform.enabled_modules (module_id, enabled, installed_version)
       VALUES ($1, true, $2)
       ON CONFLICT (module_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         installed_version = EXCLUDED.installed_version,
         updated_at = now()`,
      [moduleId, version],
    );
  }

  async listEnabled(): Promise<EnabledModuleRecord[]> {
    return this.queryMany(
      `SELECT module_id, enabled, installed_version
       FROM platform.enabled_modules
       WHERE enabled = true`,
      [],
      (row) => ({
        moduleId: row.module_id as string,
        enabled: row.enabled as boolean,
        installedVersion: row.installed_version as string,
      }),
    );
  }

  async isMigrationApplied(moduleId: string, version: string): Promise<boolean> {
    const row = await this.queryOne(
      `SELECT 1 FROM platform.module_migrations WHERE module_id = $1 AND version = $2`,
      [moduleId, version],
      () => true,
    );
    return row !== null;
  }

  async recordMigration(moduleId: string, version: string): Promise<void> {
    await this.execute(
      `INSERT INTO platform.module_migrations (module_id, version)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [moduleId, version],
    );
  }

  async runSql(sql: string): Promise<void> {
    await this.query(sql);
  }
}
