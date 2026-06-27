import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseService } from '../../database/database.service';

describe('HealthController', () => {
  let controller: HealthController;
  let database: { isConfigured: jest.Mock; ping: jest.Mock };

  beforeEach(async () => {
    database = {
      isConfigured: jest.fn(),
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DatabaseService, useValue: database }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('GET /health returns ok', () => {
    const result = controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('erganis-core');
    expect(result.timestamp).toBeDefined();
  });

  it('GET /health/ready skips database when not configured', async () => {
    database.isConfigured.mockReturnValue(false);
    const result = await controller.getReadiness();
    expect(result.database).toBe('skipped');
  });

  it('GET /health/ready reports connected when ping succeeds', async () => {
    database.isConfigured.mockReturnValue(true);
    database.ping.mockResolvedValue(true);
    const result = await controller.getReadiness();
    expect(result.database).toBe('connected');
  });

  it('GET /health/ready throws when ping fails', async () => {
    database.isConfigured.mockReturnValue(true);
    database.ping.mockResolvedValue(false);
    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
