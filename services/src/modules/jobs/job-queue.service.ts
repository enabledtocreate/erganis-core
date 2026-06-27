import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PgBoss from 'pg-boss';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JobQueueService implements OnApplicationBootstrap, OnModuleDestroy {
  private boss: PgBoss | null = null;
  private started = false;

  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
  ) {}

  isEnabled(): boolean {
    return (
      this.database.isConfigured() &&
      this.config.get<boolean>('jobsEnabled', true)
    );
  }

  isRunning(): boolean {
    return this.started && this.boss !== null;
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    const connectionString = this.config.get<string>('databaseUrl');
    if (!connectionString) {
      return;
    }
    this.boss = new PgBoss({
      connectionString,
      schema: this.config.get<string>('pgBossSchema', 'pgboss'),
    });
    await this.boss.start();
    this.started = true;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
      this.started = false;
    }
  }

  async send(
    jobName: string,
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    if (!this.boss) {
      return null;
    }
    return this.boss.send(jobName, payload);
  }

  async registerWorker(
    jobName: string,
    handler: (payload: Record<string, unknown>) => Promise<void>,
  ): Promise<void> {
    if (!this.boss) {
      return;
    }
    await this.boss.work(jobName, async (jobs) => {
      for (const job of jobs) {
        await handler((job.data ?? {}) as Record<string, unknown>);
      }
    });
  }
}
