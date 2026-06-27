import path from 'path';

export default () => ({
  port: parseInt(process.env.API_PORT ?? '5000', 10),
  host: process.env.API_HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL ?? '',
  dataRoot: process.env.ERGANIS_DATA_ROOT ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-in-production',
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'erganis_session',
  sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS ?? '86400', 10),
  jwtTtlSeconds: parseInt(process.env.JWT_TTL_SECONDS ?? '3600', 10),
  oidcCallbackBaseUrl:
    process.env.OIDC_CALLBACK_BASE_URL ?? 'http://localhost:5000',
  authLocalEnabled: (process.env.AUTH_LOCAL_ENABLED ?? 'true') === 'true',
  authOidcMock: (process.env.AUTH_OIDC_MOCK ?? 'false') === 'true',
  migrationsDir: process.env.MIGRATIONS_DIR ?? '../data/migrations',
  modulesRoot:
    process.env.MODULES_ROOT ??
    path.resolve(process.cwd(), '../../studio/modules'),
  entityLockTtlSeconds: parseInt(process.env.ENTITY_LOCK_TTL_SECONDS ?? '300', 10),
  jobsEnabled: (process.env.JOBS_ENABLED ?? 'true') === 'true',
  pgBossSchema: process.env.PGBOSS_SCHEMA ?? 'pgboss',
  outboxEnabled: (process.env.OUTBOX_ENABLED ?? 'true') === 'true',
  outboxPollIntervalMs: parseInt(process.env.OUTBOX_POLL_INTERVAL_MS ?? '2000', 10),
  outboxBatchSize: parseInt(process.env.OUTBOX_BATCH_SIZE ?? '25', 10),
});
