import pg from 'pg';
import bcrypt from 'bcryptjs';
import { createPublicId } from '@erganis/platform';

function databaseUrl() {
  const raw =
    process.env.DATABASE_URL ??
    'postgresql://erganis:dev_password@127.0.0.1:5432/erganis';
  return process.platform === 'win32'
    ? raw.replace('@localhost:', '@127.0.0.1:')
    : raw;
}

const pool = new pg.Pool({ connectionString: databaseUrl() });

const orgSlug = 'acme';
const adminEmail = 'admin@acme.com';
const designerEmail = 'designer@acme.com';
const password = 'test-password';
const passwordHash = await bcrypt.hash(password, 10);
const opId = 'seed-dev';

async function tableExists(schema, table) {
  const result = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table],
  );
  return (result.rowCount ?? 0) > 0;
}

async function clearOrgRows(schema, table, orgId) {
  await pool.query(`DELETE FROM ${schema}.${table} WHERE org_id = $1`, [orgId]);
}

// ── Platform auth ───────────────────────────────────────────────────────────

const org = await pool.query(
  `INSERT INTO platform.orgs (public_id, slug, name, allowed_domains, auth_mode)
   VALUES ($1, $2, 'Acme Corp', $3, 'both')
   ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
   RETURNING id`,
  [createPublicId('org'), orgSlug, ['acme.com']],
);
const orgId = org.rows[0].id;

await pool.query(
  `INSERT INTO platform.roles (org_id, name, permissions, is_admin)
   SELECT $1, 'admin', '{}', true
   WHERE NOT EXISTS (SELECT 1 FROM platform.roles WHERE org_id = $1 AND name = 'admin')`,
  [orgId],
);
await pool.query(
  `INSERT INTO platform.roles (org_id, name, permissions, is_admin)
   SELECT $1, 'designer', '{projects.read,inventory.read}', false
   WHERE NOT EXISTS (SELECT 1 FROM platform.roles WHERE org_id = $1 AND name = 'designer')`,
  [orgId],
);

const adminRole = await pool.query(
  `SELECT id FROM platform.roles WHERE org_id = $1 AND name = 'admin' LIMIT 1`,
  [orgId],
);
const designerRole = await pool.query(
  `SELECT id FROM platform.roles WHERE org_id = $1 AND name = 'designer' LIMIT 1`,
  [orgId],
);

const adminUser = await pool.query(
  `INSERT INTO platform.users (public_id, email, password_hash, display_name)
   VALUES ($1, $2, $3, 'Admin User')
   ON CONFLICT (email) DO UPDATE SET
     password_hash = EXCLUDED.password_hash,
     display_name = EXCLUDED.display_name
   RETURNING id, public_id`,
  [createPublicId('user'), adminEmail, passwordHash],
);
const adminUserId = adminUser.rows[0].id;
const adminPublicId = adminUser.rows[0].public_id;

const designerUser = await pool.query(
  `INSERT INTO platform.users (public_id, email, password_hash, display_name)
   VALUES ($1, $2, $3, 'Jordan Lee')
   ON CONFLICT (email) DO UPDATE SET
     password_hash = EXCLUDED.password_hash,
     display_name = EXCLUDED.display_name
   RETURNING id`,
  [createPublicId('user'), designerEmail, passwordHash],
);
const designerUserId = designerUser.rows[0].id;

await pool.query(
  `INSERT INTO platform.org_memberships (org_id, user_id, role_id)
   VALUES ($1, $2, $3)
   ON CONFLICT (org_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
  [orgId, adminUserId, adminRole.rows[0].id],
);
await pool.query(
  `INSERT INTO platform.org_memberships (org_id, user_id, role_id)
   VALUES ($1, $2, $3)
   ON CONFLICT (org_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
  [orgId, designerUserId, designerRole.rows[0].id],
);

await pool.query(
  `INSERT INTO platform.org_oidc_config
     (org_id, issuer, client_id, client_secret, scopes, authorization_endpoint)
   SELECT $1, 'https://mock-idp.test', 'mock-client', 'mock-secret',
          'openid email profile', 'http://mock-idp/authorize'
   WHERE NOT EXISTS (SELECT 1 FROM platform.org_oidc_config WHERE org_id = $1)`,
  [orgId],
);

const seeded = { helloWorld: false, inventory: false, projects: false };

// ── hello-world ─────────────────────────────────────────────────────────────

if (await tableExists('hello_world', 'greetings')) {
  await clearOrgRows('hello_world', 'greetings', orgId);
  for (const message of [
    'Welcome to Erganis Studio',
    'Envelope smoke test — module loaded',
  ]) {
    await pool.query(
      `INSERT INTO hello_world.greetings
         (public_id, org_id, message, created_by_public_id, operation_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [createPublicId('greeting'), orgId, message, adminPublicId, opId],
    );
  }
  seeded.helloWorld = true;
}

// ── inventory ───────────────────────────────────────────────────────────────

let productIds = [];
if (await tableExists('inventory', 'products')) {
  await clearOrgRows('inventory', 'products', orgId);

  const products = [
    {
      name: 'White oak flooring',
      sku: 'FLR-001',
      manufacturer: 'Acme Materials',
      description: '5" wide plank, natural finish',
      cents: 1299,
    },
    {
      name: 'Linen sofa',
      sku: 'SOF-12',
      manufacturer: 'Atelier Home',
      description: '84" three-seat, sand linen upholstery',
      cents: 420000,
    },
    {
      name: 'Brass pendant',
      sku: 'LMP-42',
      manufacturer: 'Light Co',
      description: '14" dome, brushed brass',
      cents: 89000,
    },
    {
      name: 'Calacatta marble tile',
      sku: 'TL-204',
      manufacturer: 'Stonehaus',
      description: '12×24 honed marble for bath walls',
      cents: 2800,
    },
    {
      name: 'Walnut dining table',
      sku: 'TBL-88',
      manufacturer: 'Atelier Home',
      description: '96" solid walnut, live edge',
      cents: 680000,
    },
    {
      name: 'Sheer linen drapery',
      sku: 'DRP-03',
      manufacturer: 'Textile Studio',
      description: 'Custom panel, ivory',
      cents: 45000,
    },
  ];

  for (const product of products) {
    const publicId = createPublicId('product');
    await pool.query(
      `INSERT INTO inventory.products
         (public_id, org_id, name, sku, manufacturer, description, unit_price_cents,
          created_by_public_id, updated_by_public_id, operation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)`,
      [
        publicId,
        orgId,
        product.name,
        product.sku,
        product.manufacturer,
        product.description,
        product.cents,
        adminPublicId,
        opId,
      ],
    );
    productIds.push(publicId);
  }
  seeded.inventory = true;
}

// ── projects ────────────────────────────────────────────────────────────────

if (
  (await tableExists('projects', 'projects')) &&
  (await tableExists('projects', 'rooms')) &&
  (await tableExists('projects', 'item_assignments'))
) {
  await clearOrgRows('projects', 'item_assignments', orgId);
  await clearOrgRows('projects', 'rooms', orgId);
  await clearOrgRows('projects', 'projects', orgId);

  const mercerId = createPublicId('project');
  const hartwellId = createPublicId('project');
  const whitfieldId = createPublicId('project');

  await pool.query(
    `INSERT INTO projects.projects
       (public_id, org_id, name, phase, status,
        created_by_public_id, updated_by_public_id, operation_id)
     VALUES
       ($1, $2, 'Mercer Residence', 'Schematic design', 'active', $3, $3, $4),
       ($5, $2, 'Hartwell Loft', 'FF&E selections', 'active', $3, $3, $4),
       ($6, $2, 'Whitfield Townhouse', 'Concept', 'active', $3, $3, $4)`,
    [mercerId, orgId, adminPublicId, opId, hartwellId, whitfieldId],
  );

  const livingRoomId = createPublicId('room');
  const kitchenId = createPublicId('room');
  const primarySuiteId = createPublicId('room');
  const loftMainId = createPublicId('room');
  const whitfieldParlorId = createPublicId('room');
  const whitfieldKitchenId = createPublicId('room');

  await pool.query(
    `INSERT INTO projects.rooms
       (public_id, org_id, project_public_id, name, sort_order,
        created_by_public_id, updated_by_public_id, operation_id)
     VALUES
       ($1,  $2, $3, 'Living room',    0, $4, $4, $5),
       ($6,  $2, $3, 'Kitchen',        1, $4, $4, $5),
       ($7,  $2, $3, 'Primary suite',  2, $4, $4, $5),
       ($8,  $2, $9, 'Main space',     0, $4, $4, $5),
       ($10, $2, $11, 'Parlor',        0, $4, $4, $5),
       ($12, $2, $11, 'Kitchen',       1, $4, $4, $5)`,
    [
      livingRoomId,
      orgId,
      mercerId,
      adminPublicId,
      opId,
      kitchenId,
      primarySuiteId,
      loftMainId,
      hartwellId,
      whitfieldParlorId,
      whitfieldId,
      whitfieldKitchenId,
    ],
  );

  if (productIds.length >= 6) {
    await pool.query(
      `INSERT INTO projects.item_assignments
         (public_id, org_id, project_public_id, room_public_id, product_public_id,
          quantity, notes, created_by_public_id, updated_by_public_id, operation_id)
       VALUES
         ($1,  $2, $3,  $4,  $5,  1, 'Hero piece for living area', $6, $6, $7),
         ($8,  $2, $3,  $9,  $10, 2, 'Over island',                $6, $6, $7),
         ($11, $2, $3,  $12, $13, 1, 'Bath feature wall',          $6, $6, $7),
         ($14, $2, $15, $16, $17, 1, NULL,                         $6, $6, $7),
         ($18, $2, $15, NULL, $19, 1, 'Project-wide FF&E allowance',$6, $6, $7),
         ($20, $2, $21, $22, $23, 1, 'Concept millwork reference', $6, $6, $7),
         ($24, $2, $21, $25, $26, 2, NULL,                         $6, $6, $7)`,
      [
        createPublicId('assignment'),
        orgId,
        mercerId,
        livingRoomId,
        productIds[1],
        adminPublicId,
        opId,
        createPublicId('assignment'),
        kitchenId,
        productIds[2],
        createPublicId('assignment'),
        primarySuiteId,
        productIds[3],
        createPublicId('assignment'),
        hartwellId,
        loftMainId,
        productIds[0],
        createPublicId('assignment'),
        productIds[4],
        createPublicId('assignment'),
        whitfieldId,
        whitfieldParlorId,
        productIds[5],
        createPublicId('assignment'),
        whitfieldKitchenId,
        productIds[4],
      ],
    );
  }
  seeded.projects = true;
}

await pool.query(
  `INSERT INTO platform.org_module_settings (org_id, module_id, enabled)
   VALUES ($1, 'erganis.developer', false)
   ON CONFLICT (org_id, module_id) DO UPDATE SET enabled = EXCLUDED.enabled`,
  [orgId],
);

console.log('Dev seed complete:');
console.log(`  org:       ${orgSlug}`);
console.log(`  admin:     ${adminEmail} / ${password}`);
console.log(`  designer:  ${designerEmail} / ${password}`);
console.log('  modules:');
console.log(`    hello-world: ${seeded.helloWorld ? '2 greetings' : 'skipped (run Core first)'}`);
console.log(
  `    inventory:   ${seeded.inventory ? `${productIds.length} products` : 'skipped (run Core first)'}`,
);
console.log(`    projects:    ${seeded.projects ? '3 projects, 6 rooms, 7 assignments' : 'skipped (run Core first)'}`);
console.log('  developer:   disabled by default — enable in Admin → Modules');

await pool.end();
