export default () => ({
  port: parseInt(process.env.API_PORT ?? '5000', 10),
  host: process.env.API_HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL ?? '',
  dataRoot: process.env.ERGANIS_DATA_ROOT ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
