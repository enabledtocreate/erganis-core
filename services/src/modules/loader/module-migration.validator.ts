import { access } from 'fs/promises';
import path from 'path';
import { DiscoveredModule } from '@erganis/platform';

const PLATFORM_SCHEMA = 'platform';
const FORBIDDEN_THIRD_PARTY_SCHEMAS = new Set([
  PLATFORM_SCHEMA,
  'hello_world',
  'documents',
  'inventory',
  'design',
  'build',
  'planner',
  'communications',
  'business',
  'reports',
  'presentations',
  'notes',
]);

export interface MigrationValidationResult {
  valid: boolean;
  errors: string[];
}

export function isThirdPartyModule(module: DiscoveredModule): boolean {
  const normalized = module.rootDir.replace(/\\/g, '/');
  return normalized.includes('/third-party/') || normalized.includes('\\third-party\\');
}

export function extractDeclaredSchemas(sql: string): Set<string> {
  const schemas = new Set<string>();
  const patterns = [
    /CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z][a-z0-9_]*)/gi,
    /(?:FROM|INTO|UPDATE|TABLE)\s+([a-z][a-z0-9_]*)\.[a-z][a-z0-9_]*/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sql)) !== null) {
      schemas.add(match[1].toLowerCase());
    }
  }
  return schemas;
}

export function validateModuleMigrationSql(
  module: DiscoveredModule,
  sql: string,
  migrationVersion: string,
): MigrationValidationResult {
  const errors: string[] = [];
  const thirdParty = isThirdPartyModule(module);

  if (thirdParty) {
    const schemas = extractDeclaredSchemas(sql);
    for (const schema of schemas) {
      if (schema === PLATFORM_SCHEMA) {
        errors.push(
          `Migration ${migrationVersion}: third-party module cannot modify schema "${PLATFORM_SCHEMA}"`,
        );
      }
      if (FORBIDDEN_THIRD_PARTY_SCHEMAS.has(schema) && schema !== PLATFORM_SCHEMA) {
        errors.push(
          `Migration ${migrationVersion}: third-party module cannot use first-party schema "${schema}"`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function assertThirdPartyMigrationsFolder(
  module: DiscoveredModule,
): Promise<void> {
  if (!isThirdPartyModule(module)) {
    return;
  }
  const migrationsDir = path.join(module.rootDir, 'migrations');
  try {
    await access(migrationsDir);
  } catch {
    throw new Error(
      `Third-party module ${module.manifest.id} requires a migrations/ folder`,
    );
  }
}
