import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { ModuleDiscoveryService } from './module-discovery.service';
import { ModuleLoaderService } from './module-loader.service';
import { ModuleMigrationService } from './module-migration.service';
import { ModuleRegistryRepository } from './module-registry.repository';
import { OrgModuleRepository } from './org-module.repository';
import { ModuleAccessService } from './module-access.service';
import { ModuleAdminController } from './module-admin.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ModuleAdminController],
  providers: [
    ModuleDiscoveryService,
    ModuleMigrationService,
    ModuleLoaderService,
    ModuleAccessService,
    {
      provide: ModuleRegistryRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(ModuleRegistryRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: OrgModuleRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgModuleRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [ModuleLoaderService, ModuleRegistryRepository, ModuleAccessService, OrgModuleRepository],
})
export class LoaderModule {}
