import { Module } from '@nestjs/common';
import { JobModule } from '../jobs/job.module';
import { EventDispatcherService } from './event-dispatcher.service';
import { PlatformEventHandlers } from './platform-event-handlers';

@Module({
  imports: [JobModule],
  providers: [EventDispatcherService, PlatformEventHandlers],
  exports: [EventDispatcherService],
})
export class EventModule {}
