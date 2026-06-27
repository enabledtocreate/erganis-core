import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import path from 'path';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module';
import { ModuleLoaderService } from '../src/modules/loader/module-loader.service';
import { seedAuthFixtures } from './helpers/auth-seed';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb('Operations envelope (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let seed: Awaited<ReturnType<typeof seedAuthFixtures>>;

  beforeAll(async () => {
    process.env.MODULES_ROOT = path.resolve(__dirname, '../../../studio/modules');
    process.env.AUTH_OIDC_MOCK = 'true';
    process.env.AUTH_LOCAL_ENABLED = 'true';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-secret';

    pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    await app.get(ModuleLoaderService).loadModules();
  });

  beforeEach(async () => {
    seed = await seedAuthFixtures(pool);
    await pool.query('DELETE FROM hello_world.greetings');
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('GET /operations/modules lists hello-world stub', async () => {
    const res = await request(app.getHttpServer()).get('/operations/modules').expect(200);
    expect(res.body.some((m: { id: string }) => m.id === 'erganis.hello-world')).toBe(
      true,
    );
  });

  it('POST /operations/execute runs authenticated envelope smoke', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    const res = await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'stub',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: { message: 'envelope smoke' },
      })
      .expect(201);

    expect(res.body.outcome).toBe('success');
    expect(res.body.steps[0].handler).toBe('pingSave');

    const rows = await pool.query(
      `SELECT message FROM hello_world.greetings WHERE org_id = $1`,
      [seed.orgId],
    );
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].message).toBe('envelope smoke');
  });

  it('POST /operations/execute requires session', async () => {
    await request(app.getHttpServer())
      .post('/operations/execute')
      .send({
        surfaceId: 'stub',
        action: 'save',
        orgSlug: 'acme',
        payload: {},
      })
      .expect(401);
  });
});
