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
}
