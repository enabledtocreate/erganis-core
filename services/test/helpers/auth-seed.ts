import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { createPublicId } from '@erganis/platform';

export interface AuthSeedResult {
  orgSlug: string;
  orgId: string;
  userId: string;
  email: string;
  password: string;
}

export async function seedAuthFixtures(pool: Pool): Promise<AuthSeedResult> {
  await pool.query(`
    TRUNCATE platform.sessions, platform.oidc_identities, platform.org_memberships,
             platform.roles, platform.org_oidc_config, platform.users, platform.orgs
    RESTART IDENTITY CASCADE
  `);

  const orgPublicId = createPublicId('org');
  const userPublicId = createPublicId('user');
  const email = 'admin@acme.com';
  const password = 'test-password';
  const passwordHash = await bcrypt.hash(password, 10);

  const orgResult = await pool.query(
    `INSERT INTO platform.orgs (public_id, slug, name, allowed_domains, auth_mode)
     VALUES ($1, 'acme', 'Acme Corp', $2, 'both')
     RETURNING id`,
    [orgPublicId, ['acme.com']],
  );
  const orgId = orgResult.rows[0].id as string;

  const roleResult = await pool.query(
    `INSERT INTO platform.roles (org_id, name, permissions, is_admin)
     VALUES ($1, 'admin', '{}', true)
     RETURNING id`,
    [orgId],
  );
  const roleId = roleResult.rows[0].id as string;

  const userResult = await pool.query(
    `INSERT INTO platform.users (public_id, email, password_hash, display_name)
     VALUES ($1, $2, $3, 'Admin User')
     RETURNING id`,
    [userPublicId, email, passwordHash],
  );
  const userId = userResult.rows[0].id as string;

  await pool.query(
    `INSERT INTO platform.org_memberships (org_id, user_id, role_id)
     VALUES ($1, $2, $3)`,
    [orgId, userId, roleId],
  );

  await pool.query(
    `INSERT INTO platform.org_oidc_config
       (org_id, issuer, client_id, client_secret, scopes, authorization_endpoint)
     VALUES ($1, 'https://mock-idp.test', 'mock-client', 'mock-secret', 'openid email profile', 'http://mock-idp/authorize')`,
    [orgId],
  );

  return { orgSlug: 'acme', orgId, userId, email, password };
}
