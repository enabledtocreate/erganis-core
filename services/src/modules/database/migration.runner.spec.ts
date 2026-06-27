import { ConfigService } from '@nestjs/config';
import { MigrationRunner } from './migration.runner';
import { DatabaseService } from './database.service';
import { readdir, readFile } from 'fs/promises';

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
}));

describe('MigrationRunner', () => {
  const client = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const pool = {
    connect: jest.fn().mockResolvedValue(client),
  };

  const database = {
    getPool: jest.fn().mockReturnValue(pool),
  } as unknown as DatabaseService;

  const config = {
    get: jest.fn().mockReturnValue('../data/migrations'),
  } as unknown as ConfigService;

  let runner: MigrationRunner;

  beforeEach(() => {
    jest.clearAllMocks();
    runner = new MigrationRunner(database, config);
    (readdir as jest.Mock).mockResolvedValue(['001_platform_auth.sql']);
    (readFile as jest.Mock).mockResolvedValue('CREATE TABLE test;');
    client.query.mockImplementation(async (sql: string) => {
      if (sql.includes('schema_migrations') && sql.startsWith('SELECT')) {
        return { rowCount: 0, rows: [] };
      }
      return { rowCount: 1, rows: [] };
    });
  });

  it('skips when RUN_MIGRATIONS_ON_START is false', async () => {
    process.env.RUN_MIGRATIONS_ON_START = 'false';
    await runner.onModuleInit();
    expect(pool.connect).not.toHaveBeenCalled();
    delete process.env.RUN_MIGRATIONS_ON_START;
  });

  it('applies pending migration files', async () => {
    await runner.runPendingMigrations();
    expect(readdir).toHaveBeenCalled();
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining('001_platform_auth.sql'),
      'utf8',
    );
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('skips when database pool is unavailable', async () => {
    database.getPool = jest.fn().mockReturnValue(null);
    await runner.runPendingMigrations();
    expect(pool.connect).not.toHaveBeenCalled();
    database.getPool = jest.fn().mockReturnValue(pool);
  });
});
