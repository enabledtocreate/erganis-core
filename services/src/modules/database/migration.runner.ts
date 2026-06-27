import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { DatabaseService } from './database.service';

@Injectable()
export class MigrationRunner implements OnModuleInit {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.RUN_MIGRATIONS_ON_START === 'false') {
      return;
    }
    await this.runPendingMigrations();
  }

  async runPendingMigrations(): Promise<void> {
    const pool = this.database.getPool();
    if (!pool) {
      return;
    }

    const migrationsDir = path.resolve(
      process.cwd(),
      this.config.get<string>('migrationsDir', '../data/migrations'),
    );

    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('CREATE SCHEMA IF NOT EXISTS platform');
      await client.query(`
        CREATE TABLE IF NOT EXISTS platform.schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);

      for (const file of files) {
        const version = file.replace(/\.sql$/, '');
        const existing = await client.query(
          'SELECT 1 FROM platform.schema_migrations WHERE version = $1',
          [version],
        );
        if (existing.rowCount && existing.rowCount > 0) {
          continue;
        }

        const sql = await readFile(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query(
          'INSERT INTO platform.schema_migrations (version) VALUES ($1)',
          [version],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
