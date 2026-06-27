import { DiscoveredModule } from '@erganis/platform';
import {
  extractDeclaredSchemas,
  isThirdPartyModule,
  validateModuleMigrationSql,
} from './module-migration.validator';

describe('module-migration.validator', () => {
  const thirdPartyModule: DiscoveredModule = {
    manifest: {
      id: 'vendor.widget',
      name: 'Widget',
      version: '1.0.0',
      erganisCoreVersion: '^0.1.0',
      entryPoint: './dist/index.js',
    },
    rootDir: '/studio/modules/third-party/vendor/widget',
    manifestPath: '/studio/modules/third-party/vendor/widget/erganis.module.json',
  };

  const firstPartyModule: DiscoveredModule = {
    ...thirdPartyModule,
    manifest: { ...thirdPartyModule.manifest, id: 'erganis.documents' },
    rootDir: '/studio/modules/documents',
  };

  it('detects third-party path', () => {
    expect(isThirdPartyModule(thirdPartyModule)).toBe(true);
    expect(isThirdPartyModule(firstPartyModule)).toBe(false);
  });

  it('rejects third-party SQL touching platform schema', () => {
    const result = validateModuleMigrationSql(
      thirdPartyModule,
      'CREATE TABLE platform.evil (id uuid);',
      '001',
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('platform');
  });

  it('rejects third-party SQL touching hello_world schema', () => {
    const result = validateModuleMigrationSql(
      thirdPartyModule,
      'INSERT INTO hello_world.greetings VALUES (1);',
      '001',
    );
    expect(result.valid).toBe(false);
  });

  it('allows third-party SQL in own schema', () => {
    const result = validateModuleMigrationSql(
      thirdPartyModule,
      'CREATE SCHEMA vendor_widget; CREATE TABLE vendor_widget.items (id uuid);',
      '001',
    );
    expect(result.valid).toBe(true);
  });

  it('extractDeclaredSchemas finds create schema', () => {
    expect(extractDeclaredSchemas('CREATE SCHEMA IF NOT EXISTS foo;')).toEqual(
      new Set(['foo']),
    );
  });
});
