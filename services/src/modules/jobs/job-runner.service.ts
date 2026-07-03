import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleLoaderService } from '../loader/module-loader.service';
import { CodesProviderService } from '../codes/codes-provider.service';
import { SearchService } from '../search/search.service';
import { JobQueueService } from './job-queue.service';
import { PLATFORM_JOBS } from './platform-jobs';

@Injectable()
export class JobRunnerService implements OnApplicationBootstrap {
  constructor(
    private readonly jobs: JobQueueService,
    private readonly moduleLoader: ModuleLoaderService,
    private readonly search: SearchService,
    private readonly codes: CodesProviderService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.moduleLoader.whenReady();
    if (!this.jobs.isRunning()) {
      return;
    }

    await this.jobs.registerWorker(PLATFORM_JOBS.searchTouch, async (payload) => {
      await this.search.indexOperation(payload);
    });

    await this.jobs.registerWorker(PLATFORM_JOBS.searchIndex, async (payload) => {
      await this.search.upsertDocument(payload);
    });

    await this.jobs.registerWorker(PLATFORM_JOBS.codesSync, async (payload) => {
      const rules = payload.rules;
      if (Array.isArray(rules) && rules.length > 0) {
        await this.codes.importRules(String(payload.source ?? 'external'), rules as never);
        return;
      }
      await this.codes.ensureSeedData();
    });

    for (const [jobKey, handler] of this.moduleLoader.getJobHandlers()) {
      await this.jobs.registerWorker(jobKey, handler);
    }
  }
}
