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

describeWithDb('Admin modules and developer surface (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let seed: Awaited<ReturnType<typeof seedAuthFixtures>>;

  beforeAll(async () => {
    process.env.MODULES_ROOT = path.resolve(__dirname, '../../../studio/modules');
    process.env.MODULES_EXTRA_ROOTS = path.resolve(__dirname, '../../../developer');
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
    await pool.query('DELETE FROM platform.org_module_settings');
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  async function adminLogin() {
    return request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });
  }

  it('GET /admin/:orgSlug/modules requires authentication', async () => {
    await request(app.getHttpServer())
      .get(`/admin/${seed.orgSlug}/modules`)
      .expect(401);
  });

  it('GET /admin/:orgSlug/modules lists installed modules', async () => {
    const login = await adminLogin();

    const res = await request(app.getHttpServer())
      .get(`/admin/${seed.orgSlug}/modules`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    expect(res.body.moduleRegistryUrl).toBeTruthy();
    expect(res.body.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moduleId: 'erganis.hello-world', enabled: true }),
        expect.objectContaining({ moduleId: 'erganis.inventory', enabled: true }),
        expect.objectContaining({ moduleId: 'erganis.projects', enabled: true }),
      ]),
    );
  });

  it('GET /admin/:orgSlug/modules includes developer as opt-in and disabled by default', async () => {
    const login = await adminLogin();

    const res = await request(app.getHttpServer())
      .get(`/admin/${seed.orgSlug}/modules`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    const developer = res.body.modules.find(
      (mod: { moduleId: string }) => mod.moduleId === 'erganis.developer',
    );
    expect(developer).toMatchObject({
      moduleId: 'erganis.developer',
      name: 'Developer',
      shipByDefault: false,
      enabled: false,
    });
    expect(developer.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ surfaceId: 'developer', action: 'load' }),
      ]),
    );
  });

  it('POST /admin/:orgSlug/modules/:moduleId toggles developer enablement', async () => {
    const login = await adminLogin();

    const enabled = await request(app.getHttpServer())
      .post(`/admin/${seed.orgSlug}/modules/erganis.developer`)
      .set('Cookie', login.headers['set-cookie'])
      .send({ enabled: true })
      .expect(201);

    expect(enabled.body).toEqual({
      ok: true,
      moduleId: 'erganis.developer',
      enabled: true,
    });

    const list = await request(app.getHttpServer())
      .get(`/admin/${seed.orgSlug}/modules`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    expect(
      list.body.modules.find((mod: { moduleId: string }) => mod.moduleId === 'erganis.developer')
        ?.enabled,
    ).toBe(true);

    await request(app.getHttpServer())
      .post(`/admin/${seed.orgSlug}/modules/erganis.developer`)
      .set('Cookie', login.headers['set-cookie'])
      .send({ enabled: false })
      .expect(201);
  });

  it('GET /surfaces/developer/load is forbidden when developer module is disabled', async () => {
    const login = await adminLogin();

    await request(app.getHttpServer())
      .get(`/surfaces/developer/load?orgSlug=${seed.orgSlug}`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(403);
  });

  it('GET /surfaces/developer/load returns module graph when developer is enabled', async () => {
    const login = await adminLogin();

    await request(app.getHttpServer())
      .post(`/admin/${seed.orgSlug}/modules/erganis.developer`)
      .set('Cookie', login.headers['set-cookie'])
      .send({ enabled: true })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/surfaces/developer/load?orgSlug=${seed.orgSlug}`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    const step = res.body.modules['erganis.developer']?.['developer-graph'];
    expect(step?.data?.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moduleId: 'erganis.developer' }),
        expect.objectContaining({ moduleId: 'erganis.projects' }),
      ]),
    );
    expect(step?.data?.linkTypes?.length).toBeGreaterThan(0);
    expect(step?.data?.pipeline?.length).toBeGreaterThan(0);
    expect(step?.data?.contracts?.length).toBeGreaterThan(0);
  });
});
