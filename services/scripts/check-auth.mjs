import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://erganis:dev_password@127.0.0.1:5432/erganis',
});

const orgs = await pool.query('SELECT slug, name, auth_mode FROM platform.orgs ORDER BY slug');
console.log('orgs:', JSON.stringify(orgs.rows, null, 2));

const users = await pool.query(
  'SELECT email, display_name, password_hash IS NOT NULL AS has_password FROM platform.users ORDER BY email',
);
console.log('users:', JSON.stringify(users.rows, null, 2));

const memberships = await pool.query(`
  SELECT o.slug, u.email, r.name AS role
  FROM platform.org_memberships m
  JOIN platform.orgs o ON o.id = m.org_id
  JOIN platform.users u ON u.id = m.user_id
  JOIN platform.roles r ON r.id = m.role_id
  ORDER BY o.slug, u.email
`);
console.log('memberships:', JSON.stringify(memberships.rows, null, 2));

await pool.end();
