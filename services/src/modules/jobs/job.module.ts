import { Module } from '@nestjs/common';
import { LoaderModule } from '../loader/loader.module';
import { SearchModule } from '../search/search.module';
import { JobQueueService } from './job-queue.service';
import { JobRunnerService } from './job-runner.service';

@Module({
  imports: [LoaderModule, SearchModule],
  providers: [JobQueueService, JobRunnerService],
  exports: [JobQueueService],
})
export class JobModule {}
