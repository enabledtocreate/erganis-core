import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';
import { RoleRecord, mapRole } from './org.repository';

@Injectable()
export class MembershipRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async findMembership(
    orgId: string,
    userId: string,
  ): Promise<{ role: RoleRecord } | null> {
    const role = await this.queryOne(
      `SELECT r.id, r.org_id, r.name, r.permissions, r.is_admin
       FROM platform.org_memberships m
       JOIN platform.roles r ON r.id = m.role_id
       WHERE m.org_id = $1 AND m.user_id = $2`,
      [orgId, userId],
      mapRole,
    );
    if (!role) {
      return null;
    }
    return { role };
  }

  async addMembership(orgId: string, userId: string, roleId: string): Promise<void> {
    await this.execute(
      `INSERT INTO platform.org_memberships (org_id, user_id, role_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
      [orgId, userId, roleId],
    );
  }

  async listMembers(orgId: string): Promise<
    Array<{
      userPublicId: string;
      email: string;
      displayName: string | null;
      roleName: string;
      isAdmin: boolean;
      joinedAt: string;
    }>
  > {
    return this.queryMany(
      `SELECT u.public_id, u.email, u.display_name,
              r.name AS role_name, r.is_admin, m.created_at
       FROM platform.org_memberships m
       JOIN platform.users u ON u.id = m.user_id
       JOIN platform.roles r ON r.id = m.role_id
       WHERE m.org_id = $1
       ORDER BY u.email ASC`,
      [orgId],
      (row) => ({
        userPublicId: String(row.public_id),
        email: String(row.email),
        displayName: row.display_name ? String(row.display_name) : null,
        roleName: String(row.role_name),
        isAdmin: Boolean(row.is_admin),
        joinedAt: String(row.created_at),
      }),
    );
  }
}
