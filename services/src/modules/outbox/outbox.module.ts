import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EventModule } from '../events/event.module';
import { PlatformServicesModule } from '../platform-services/platform-services.module';
import { OutboxPollerService } from './outbox-poller.service';

@Module({
  imports: [DatabaseModule, EventModule, PlatformServicesModule],
  providers: [OutboxPollerService],
})
export class OutboxModule {}
