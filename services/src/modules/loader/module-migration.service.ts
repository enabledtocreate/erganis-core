import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import path from 'path';
import { DiscoveredModule } from '@erganis/platform';
import { ModuleRegistryRepository } from './module-registry.repository';
import {
  assertThirdPartyMigrationsFolder,
  validateModuleMigrationSql,
} from './module-migration.validator';

@Injectable()
export class ModuleMigrationService {
  constructor(private readonly registry: ModuleRegistryRepository) {}

  async applyModuleMigrations(module: DiscoveredModule): Promise<void> {
    await assertThirdPartyMigrationsFolder(module);

    const migrations = module.manifest.migrations ?? [];
    for (const migration of migrations.sort((a, b) =>
      a.version.localeCompare(b.version),
    )) {
      const applied = await this.registry.isMigrationApplied(
        module.manifest.id,
        migration.version,
      );
      if (applied) {
        continue;
      }

      const sqlPath = path.resolve(module.rootDir, migration.path);
      const sql = await readFile(sqlPath, 'utf8');
      const validation = validateModuleMigrationSql(module, sql, migration.version);
      if (!validation.valid) {
        throw new Error(
          `Module ${module.manifest.id} migration validation failed: ${validation.errors.join('; ')}`,
        );
      }
      await this.registry.runSql(sql);
      await this.registry.recordMigration(module.manifest.id, migration.version);
    }
  }
}
