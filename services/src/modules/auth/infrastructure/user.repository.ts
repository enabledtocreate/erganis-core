import { Injectable } from '@nestjs/common';
import { createPublicId } from '@erganis/platform';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

export interface UserRecord {
  id: string;
  publicId: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
}

@Injectable()
export class UserRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.queryOne(
      `SELECT id, public_id, email, password_hash, display_name
       FROM platform.users WHERE lower(email) = lower($1)`,
      [email],
      mapUser,
    );
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.queryOne(
      `SELECT id, public_id, email, password_hash, display_name
       FROM platform.users WHERE id = $1`,
      [id],
      mapUser,
    );
  }

  async findByPublicId(publicId: string): Promise<UserRecord | null> {
    return this.queryOne(
      `SELECT id, public_id, email, password_hash, display_name
       FROM platform.users WHERE public_id = $1`,
      [publicId],
      mapUser,
    );
  }

  async createUser(input: {
    email: string;
    passwordHash?: string | null;
    displayName?: string | null;
    publicId?: string;
  }): Promise<UserRecord> {
    const publicId = input.publicId ?? createPublicId('user');
    const created = await this.queryOne(
      `INSERT INTO platform.users (public_id, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, public_id, email, password_hash, display_name`,
      [publicId, input.email.toLowerCase(), input.passwordHash ?? null, input.displayName ?? null],
      mapUser,
    );
    if (!created) {
      throw new Error('Failed to create user');
    }
    return created;
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.execute(`UPDATE platform.users SET display_name = $2 WHERE id = $1`, [
      userId,
      displayName,
    ]);
  }
}

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    publicId: row.public_id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string | null,
    displayName: row.display_name as string | null,
  };
}
