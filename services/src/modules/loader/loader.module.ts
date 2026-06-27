import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { ModuleDiscoveryService } from './module-discovery.service';
import { ModuleLoaderService } from './module-loader.service';
import { ModuleMigrationService } from './module-migration.service';
import { ModuleRegistryRepository } from './module-registry.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    ModuleDiscoveryService,
    ModuleMigrationService,
    ModuleLoaderService,
    {
      provide: ModuleRegistryRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(ModuleRegistryRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [ModuleLoaderService, ModuleRegistryRepository],
})
export class LoaderModule {}
