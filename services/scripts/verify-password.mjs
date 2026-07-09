import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: 'postgresql://erganis:dev_password@127.0.0.1:5432/erganis',
});

const user = await pool.query(
  'SELECT email, password_hash FROM platform.users WHERE email = $1',
  ['admin@acme.com'],
);
const row = user.rows[0];
if (!row) {
  console.log('user missing');
} else {
  const ok = await bcrypt.compare('test-password', row.password_hash);
  console.log('test-password matches:', ok);
}

await pool.end();
