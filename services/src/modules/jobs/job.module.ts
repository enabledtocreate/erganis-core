import { Module } from '@nestjs/common';
import { LoaderModule } from '../loader/loader.module';
import { SearchModule } from '../search/search.module';
import { CodesModule } from '../codes/codes.module';
import { JobQueueService } from './job-queue.service';
import { JobRunnerService } from './job-runner.service';

@Module({
  imports: [LoaderModule, SearchModule, CodesModule],
  providers: [JobQueueService, JobRunnerService],
  exports: [JobQueueService],
})
export class JobModule {}
