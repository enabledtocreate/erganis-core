import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import type { DatabaseHealthResponse, HealthResponse } from '@erganis/platform';
import { DatabaseService } from '../../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'erganis-core',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async getReadiness(): Promise<DatabaseHealthResponse> {
    const base: HealthResponse = {
      status: 'ok',
      service: 'erganis-core',
      timestamp: new Date().toISOString(),
    };

    if (!this.database.isConfigured()) {
      return { ...base, database: 'skipped' };
    }

    const connected = await this.database.ping();
    if (!connected) {
      throw new ServiceUnavailableException({
        ...base,
        status: 'degraded',
        database: 'disconnected',
      });
    }

    return { ...base, database: 'connected' };
  }
}
