import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module';
import { MigrationRunner } from '../src/modules/database/migration.runner';
import { seedAuthFixtures } from './helpers/auth-seed';

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip;

describeWithDb('Auth (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let seed: Awaited<ReturnType<typeof seedAuthFixtures>>;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    process.env.AUTH_OIDC_MOCK = 'true';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const runner = app.get(MigrationRunner);
    await runner.runPendingMigrations();
  });

  beforeEach(async () => {
    seed = await seedAuthFixtures(pool);
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('POST /auth/local/:orgSlug/login returns session view', async () => {
    const res = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password })
      .expect(201);

    expect(res.body.user.email).toBe(seed.email);
    expect(res.body.role.isAdmin).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('GET /auth/me/:orgSlug requires session cookie', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    const cookie = login.headers['set-cookie'];
    const res = await request(app.getHttpServer())
      .get(`/auth/me/${seed.orgSlug}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body.org.slug).toBe('acme');
  });

  it('POST /auth/logout clears session', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', login.headers['set-cookie'])
      .expect(201);

    await request(app.getHttpServer())
      .get(`/auth/me/${seed.orgSlug}`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(401);
  });

  it('POST /auth/token returns JWT from session', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    const res = await request(app.getHttpServer())
      .post('/auth/token')
      .set('Cookie', login.headers['set-cookie'])
      .send({ orgSlug: seed.orgSlug })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.expiresIn).toBeGreaterThan(0);
  });

  it('POST /auth/token accepts email/password without cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        orgSlug: seed.orgSlug,
        email: seed.email,
        password: seed.password,
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('OIDC mock callback provisions new user by domain', async () => {
    const start = await request(app.getHttpServer())
      .get(`/auth/oidc/${seed.orgSlug}/start`)
      .expect(200);

    const state = start.body.state as string;
    const code = 'mock-code:jit@acme.com';

    const res = await request(app.getHttpServer())
      .get(`/auth/oidc/${seed.orgSlug}/callback`)
      .query({ code, state })
      .expect(200);

    expect(res.body.user.email).toBe('jit@acme.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects local login for wrong password', async () => {
    await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: 'wrong-password' })
      .expect(401);
  });
});
