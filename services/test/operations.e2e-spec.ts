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
    await pool.query('DELETE FROM inventory.products');
    await pool.query('DELETE FROM projects.item_assignments');
    await pool.query('DELETE FROM projects.rooms');
    await pool.query('DELETE FROM projects.projects');
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
    expect(res.body.some((m: { id: string }) => m.id === 'erganis.inventory')).toBe(
      true,
    );
    expect(res.body.some((m: { id: string }) => m.id === 'erganis.projects')).toBe(
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

  it('POST /operations/execute saves inventory product', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    const res = await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'inventory',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: {
          name: 'Oak flooring',
          sku: 'FLR-001',
          manufacturer: 'Acme Materials',
          unitPriceCents: 1299,
        },
      })
      .expect(201);

    expect(res.body.outcome).toBe('success');
    expect(res.body.steps[0].handler).toBe('saveProduct');
    expect(res.body.steps[0].result?.data?.product).toMatchObject({
      name: 'Oak flooring',
      sku: 'FLR-001',
      unitPriceCents: 1299,
    });

    const rows = await pool.query(
      `SELECT name, sku, unit_price_cents FROM inventory.products WHERE org_id = $1`,
      [seed.orgId],
    );
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].name).toBe('Oak flooring');
  });

  it('GET /surfaces/inventory/load lists products', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'inventory',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: { name: 'Desk lamp', sku: 'LMP-42' },
      })
      .expect(201);

    const load = await request(app.getHttpServer())
      .get(`/surfaces/inventory/load?orgSlug=${seed.orgSlug}`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    const step = load.body.modules['erganis.inventory']?.['inventory-list'];
    expect(step?.data?.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Desk lamp', sku: 'LMP-42' }),
      ]),
    );
  });

  it('POST /operations/execute creates project, room, and assignment', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    const productRes = await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'inventory',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: { name: 'Velvet sofa', sku: 'SOF-01' },
      })
      .expect(201);

    const productPublicId = productRes.body.steps[0].result?.data?.product?.publicId as string;

    const projectRes = await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'project',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: { name: 'Mercer Residence', phase: 'Schematic design' },
      })
      .expect(201);

    const projectPublicId = projectRes.body.steps[0].result?.data?.project?.publicId as string;

    const roomRes = await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'room',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: { projectPublicId, name: 'Living room' },
      })
      .expect(201);

    const roomPublicId = roomRes.body.steps[0].result?.data?.room?.publicId as string;

    await request(app.getHttpServer())
      .post('/operations/execute')
      .set('Cookie', login.headers['set-cookie'])
      .send({
        surfaceId: 'assignment',
        action: 'save',
        orgSlug: seed.orgSlug,
        payload: { projectPublicId, roomPublicId, productPublicId, quantity: 2 },
      })
      .expect(201);

    const load = await request(app.getHttpServer())
      .get(`/surfaces/project/load?orgSlug=${seed.orgSlug}&projectPublicId=${projectPublicId}`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    const step = load.body.modules['erganis.projects']?.['project-list'];
    expect(step?.data?.project).toMatchObject({ name: 'Mercer Residence' });
    expect(step?.data?.rooms).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Living room' })]),
    );
    expect(step?.data?.assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productName: 'Velvet sofa', quantity: 2 }),
      ]),
    );
  });

  it('GET /admin/:orgSlug/users lists org members for admin', async () => {
    const login = await request(app.getHttpServer())
      .post(`/auth/local/${seed.orgSlug}/login`)
      .send({ email: seed.email, password: seed.password });

    const res = await request(app.getHttpServer())
      .get(`/admin/${seed.orgSlug}/users`)
      .set('Cookie', login.headers['set-cookie'])
      .expect(200);

    expect(res.body.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: seed.email, isAdmin: true }),
      ]),
    );
  });
});
