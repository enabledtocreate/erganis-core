import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool | null;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('databaseUrl');
    this.pool = url ? new Pool({ connectionString: url }) : null;
  }

  isConfigured(): boolean {
    return this.pool !== null;
  }

  getPool(): Pool | null {
    return this.pool;
  }

  async ping(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
