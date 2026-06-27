import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { JobQueueService } from '../jobs/job-queue.service';
import { PLATFORM_JOBS } from '../jobs/platform-jobs';
import { EventDispatcherService } from './event-dispatcher.service';

@Injectable()
export class PlatformEventHandlers implements OnApplicationBootstrap {
  constructor(
    private readonly dispatcher: EventDispatcherService,
    private readonly jobs: JobQueueService,
  ) {}

  onApplicationBootstrap(): void {
    this.dispatcher.register('operation.completed', async (payload) => {
      await this.jobs.send(PLATFORM_JOBS.searchTouch, payload);
    });
  }
}
