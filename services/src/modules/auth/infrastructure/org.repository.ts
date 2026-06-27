import { Injectable } from '@nestjs/common';
import { AuthMode } from '@erganis/platform';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

export interface OrgRecord {
  id: string;
  publicId: string;
  slug: string;
  name: string;
  allowedDomains: string[];
  authMode: AuthMode;
}

export interface OrgOidcConfigRecord {
  orgId: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  authorizationEndpoint: string | null;
  tokenEndpoint: string | null;
  jwksUri: string | null;
}

export interface UserRecord {
  id: string;
  publicId: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
}

export interface RoleRecord {
  id: string;
  orgId: string;
  name: string;
  permissions: string[];
  isAdmin: boolean;
}

export interface MembershipRecord {
  orgId: string;
  userId: string;
  roleId: string;
}

@Injectable()
export class OrgRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async findBySlug(slug: string): Promise<OrgRecord | null> {
    return this.queryOne(
      `SELECT id, public_id, slug, name, allowed_domains, auth_mode
       FROM platform.orgs WHERE slug = $1`,
      [slug],
      mapOrg,
    );
  }

  async findById(id: string): Promise<OrgRecord | null> {
    return this.queryOne(
      `SELECT id, public_id, slug, name, allowed_domains, auth_mode
       FROM platform.orgs WHERE id = $1`,
      [id],
      mapOrg,
    );
  }

  async findOidcConfig(orgId: string): Promise<OrgOidcConfigRecord | null> {
    return this.queryOne(
      `SELECT org_id, issuer, client_id, client_secret, scopes,
              authorization_endpoint, token_endpoint, jwks_uri
       FROM platform.org_oidc_config WHERE org_id = $1`,
      [orgId],
      (row) => ({
        orgId: row.org_id as string,
        issuer: row.issuer as string,
        clientId: row.client_id as string,
        clientSecret: row.client_secret as string,
        scopes: row.scopes as string,
        authorizationEndpoint: row.authorization_endpoint as string | null,
        tokenEndpoint: row.token_endpoint as string | null,
        jwksUri: row.jwks_uri as string | null,
      }),
    );
  }

  async createOrg(input: {
    publicId: string;
    slug: string;
    name: string;
    allowedDomains: string[];
    authMode: AuthMode;
  }): Promise<OrgRecord> {
    const created = await this.queryOne(
      `INSERT INTO platform.orgs (public_id, slug, name, allowed_domains, auth_mode)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, public_id, slug, name, allowed_domains, auth_mode`,
      [input.publicId, input.slug, input.name, input.allowedDomains, input.authMode],
      mapOrg,
    );
    if (!created) {
      throw new Error('Failed to create org');
    }
    return created;
  }

  async upsertOidcConfig(input: OrgOidcConfigRecord): Promise<void> {
    await this.execute(
      `INSERT INTO platform.org_oidc_config
         (org_id, issuer, client_id, client_secret, scopes,
          authorization_endpoint, token_endpoint, jwks_uri)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (org_id) DO UPDATE SET
         issuer = EXCLUDED.issuer,
         client_id = EXCLUDED.client_id,
         client_secret = EXCLUDED.client_secret,
         scopes = EXCLUDED.scopes,
         authorization_endpoint = EXCLUDED.authorization_endpoint,
         token_endpoint = EXCLUDED.token_endpoint,
         jwks_uri = EXCLUDED.jwks_uri`,
      [
        input.orgId,
        input.issuer,
        input.clientId,
        input.clientSecret,
        input.scopes,
        input.authorizationEndpoint,
        input.tokenEndpoint,
        input.jwksUri,
      ],
    );
  }

  async ensureAdminRole(orgId: string): Promise<RoleRecord> {
    const existing = await this.queryOne(
      `SELECT id, org_id, name, permissions, is_admin
       FROM platform.roles WHERE org_id = $1 AND is_admin = true LIMIT 1`,
      [orgId],
      mapRole,
    );
    if (existing) {
      return existing;
    }
    const created = await this.queryOne(
      `INSERT INTO platform.roles (org_id, name, permissions, is_admin)
       VALUES ($1, 'admin', '{}', true)
       RETURNING id, org_id, name, permissions, is_admin`,
      [orgId],
      mapRole,
    );
    if (!created) {
      throw new Error('Failed to create admin role');
    }
    return created;
  }
}

function mapOrg(row: Record<string, unknown>): OrgRecord {
  return {
    id: row.id as string,
    publicId: row.public_id as string,
    slug: row.slug as string,
    name: row.name as string,
    allowedDomains: (row.allowed_domains as string[]) ?? [],
    authMode: row.auth_mode as AuthMode,
  };
}

function mapRole(row: Record<string, unknown>): RoleRecord {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    permissions: (row.permissions as string[]) ?? [],
    isAdmin: row.is_admin as boolean,
  };
}

export { mapRole };
