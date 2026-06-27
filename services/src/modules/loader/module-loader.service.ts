import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { createRequire } from 'module';
import path from 'path';
import {
  DiscoveredModule,
  ModuleManifestOperation,
  StepHandler,
  StepHandlerRegistry,
  stepHandlerKey,
} from '@erganis/platform';
import { DatabaseService } from '../database/database.service';
import { ModuleDiscoveryService } from './module-discovery.service';
import { ModuleMigrationService } from './module-migration.service';
import { ModuleRegistryRepository } from './module-registry.repository';

export interface RegisteredModule {
  manifest: DiscoveredModule['manifest'];
  rootDir: string;
  operations: ModuleManifestOperation[];
}

@Injectable()
export class ModuleLoaderService implements OnApplicationBootstrap {
  private readonly handlers: StepHandlerRegistry = new Map();
  private readonly modules: RegisteredModule[] = [];

  constructor(
    private readonly discovery: ModuleDiscoveryService,
    private readonly migrations: ModuleMigrationService,
    private readonly registry: ModuleRegistryRepository,
    private readonly database: DatabaseService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.database.isConfigured()) {
      return;
    }
    await this.loadModules();
  }

  async loadModules(): Promise<void> {
    this.handlers.clear();
    this.modules.length = 0;

    const discovered = await this.discovery.discover();
    for (const mod of discovered) {
      await this.migrations.applyModuleMigrations(mod);
      await this.registry.upsertEnabled(mod.manifest.id, mod.manifest.version);
      await this.loadHandlers(mod);
      this.modules.push({
        manifest: mod.manifest,
        rootDir: mod.rootDir,
        operations: mod.manifest.contributions?.operations ?? [],
      });
    }
  }

  getHandlers(): StepHandlerRegistry {
    return this.handlers;
  }

  getEnabledModules(): RegisteredModule[] {
    return [...this.modules];
  }

  private async loadHandlers(mod: DiscoveredModule): Promise<void> {
    const entryPath = path.resolve(mod.rootDir, mod.manifest.entryPoint);
    const entry = this.loadEntryModule(mod.rootDir, entryPath);

    for (const op of mod.manifest.contributions?.operations ?? []) {
      const handler = this.resolveHandler(entry, op.handler);
      if (!handler) {
        throw new Error(
          `Handler ${op.handler} not exported from ${mod.manifest.entryPoint}`,
        );
      }
      this.handlers.set(stepHandlerKey(mod.manifest.id, op.handler), handler);
    }
  }

  private resolveHandler(
    entry: Record<string, unknown>,
    handlerName: string,
  ): StepHandler | undefined {
    const direct = entry[handlerName];
    if (typeof direct === 'function') {
      return direct as StepHandler;
    }
    const handlers = entry.handlers as Record<string, StepHandler> | undefined;
    return handlers?.[handlerName];
  }

  private loadEntryModule(
    moduleRoot: string,
    entryPath: string,
  ): Record<string, unknown> {
    const requireFromModule = createRequire(path.join(moduleRoot, 'package.json'));
    return requireFromModule(entryPath) as Record<string, unknown>;
  }
}
