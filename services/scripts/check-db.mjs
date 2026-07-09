import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://erganis:dev_password@127.0.0.1:5432/erganis',
});

const orgs = await pool.query('SELECT slug, name FROM platform.orgs ORDER BY slug');
console.log('orgs:', JSON.stringify(orgs.rows));

try {
  const products = await pool.query('SELECT count(*)::int AS n FROM inventory.products');
  console.log('products:', products.rows[0]);
} catch {
  console.log('products: schema not ready');
}

await pool.end();
