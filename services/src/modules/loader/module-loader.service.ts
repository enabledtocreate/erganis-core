import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { createRequire } from 'module';
import path from 'path';
import {
  DiscoveredModule,
  JobHandler,
  JobHandlerRegistry,
  ModuleManifestOperation,
  StepHandler,
  StepHandlerRegistry,
  jobHandlerKey,
  stepHandlerKey,
} from '@erganis/platform';
import { DatabaseService } from '../database/database.service';
import { validateLayoutFile } from '../composition/layout.validator';
import { ModuleDiscoveryService } from './module-discovery.service';
import { ModuleMigrationService } from './module-migration.service';
import { ModuleRegistryRepository } from './module-registry.repository';

export interface RegisteredModule {
  manifest: DiscoveredModule['manifest'];
  rootDir: string;
  operations: ModuleManifestOperation[];
  jobs: NonNullable<DiscoveredModule['manifest']['contributions']>['jobs'];
}

@Injectable()
export class ModuleLoaderService implements OnApplicationBootstrap {
  private readonly handlers: StepHandlerRegistry = new Map();
  private readonly jobHandlers: JobHandlerRegistry = new Map();
  private readonly modules: RegisteredModule[] = [];
  private readyResolve!: () => void;
  private readonly ready = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

  constructor(
    private readonly discovery: ModuleDiscoveryService,
    private readonly migrations: ModuleMigrationService,
    private readonly registry: ModuleRegistryRepository,
    private readonly database: DatabaseService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.database.isConfigured()) {
      this.readyResolve();
      return;
    }
    await this.loadModules();
    this.readyResolve();
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  async loadModules(): Promise<void> {
    this.handlers.clear();
    this.jobHandlers.clear();
    this.modules.length = 0;

    const discovered = await this.discovery.discover();
    for (const mod of discovered) {
      await this.migrations.applyModuleMigrations(mod);
      await this.registry.upsertEnabled(mod.manifest.id, mod.manifest.version);
      await this.loadHandlers(mod);
      await this.loadJobHandlers(mod);
      await this.validateModuleLayouts(mod);
      this.modules.push({
        manifest: mod.manifest,
        rootDir: mod.rootDir,
        operations: mod.manifest.contributions?.operations ?? [],
        jobs: mod.manifest.contributions?.jobs ?? [],
      });
    }
  }

  getHandlers(): StepHandlerRegistry {
    return this.handlers;
  }

  getJobHandlers(): JobHandlerRegistry {
    return this.jobHandlers;
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

  private async loadJobHandlers(mod: DiscoveredModule): Promise<void> {
    const entryPath = path.resolve(mod.rootDir, mod.manifest.entryPoint);
    const entry = this.loadEntryModule(mod.rootDir, entryPath);

    for (const job of mod.manifest.contributions?.jobs ?? []) {
      const handler = this.resolveJobHandler(entry, job.handler);
      if (!handler) {
        throw new Error(
          `Job handler ${job.handler} not exported from ${mod.manifest.entryPoint}`,
        );
      }
      this.jobHandlers.set(jobHandlerKey(mod.manifest.id, job.handler), handler);
    }
  }

  private resolveJobHandler(
    entry: Record<string, unknown>,
    handlerName: string,
  ): JobHandler | undefined {
    const direct = entry[handlerName];
    if (typeof direct === 'function') {
      return direct as JobHandler;
    }
    const jobs = entry.jobs as Record<string, JobHandler> | undefined;
    return jobs?.[handlerName];
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
    const moduleRootAbs = path.resolve(moduleRoot);
    const entryAbs = path.resolve(entryPath);
    const requireFromModule = createRequire(path.join(moduleRootAbs, 'package.json'));
    return requireFromModule(entryAbs) as Record<string, unknown>;
  }

  private async validateModuleLayouts(mod: DiscoveredModule): Promise<void> {
    for (const layout of mod.manifest.contributions?.layout ?? []) {
      const layoutPath = path.resolve(mod.rootDir, layout.path);
      const result = await validateLayoutFile(layoutPath, layout.surfaceId);
      if (!result.valid) {
        throw new Error(
          `Module ${mod.manifest.id} layout validation failed: ${result.errors.join('; ')}`,
        );
      }
    }
  }
}
