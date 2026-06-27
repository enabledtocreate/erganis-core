import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { EventDispatcherService } from '../events/event-dispatcher.service';
import { OutboxRepository } from '../platform-services/platform-repositories';

@Injectable()
export class OutboxPollerService implements OnApplicationBootstrap, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;
  private polling = false;

  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
    private readonly outbox: OutboxRepository,
    private readonly dispatcher: EventDispatcherService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.database.isConfigured() || !this.config.get<boolean>('outboxEnabled', true)) {
      return;
    }
    const intervalMs = this.config.get<number>('outboxPollIntervalMs', 2000);
    this.timer = setInterval(() => {
      void this.pollOnce();
    }, intervalMs);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async pollOnce(): Promise<number> {
    if (this.polling) {
      return 0;
    }
    this.polling = true;
    try {
      const batchSize = this.config.get<number>('outboxBatchSize', 25);
      const pending = await this.outbox.fetchPending(batchSize);
      if (pending.length === 0) {
        return 0;
      }
      for (const event of pending) {
        await this.dispatcher.dispatch(event.eventType, event.payload);
      }
      await this.outbox.markPublished(pending.map((event) => event.id));
      return pending.length;
    } finally {
      this.polling = false;
    }
  }
}
