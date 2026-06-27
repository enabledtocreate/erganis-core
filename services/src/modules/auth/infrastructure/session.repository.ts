import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { createHash, randomBytes } from 'crypto';
import { Pool } from 'pg';

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class SessionRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  static generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  async createSession(
    userId: string,
    expiresAt: Date,
  ): Promise<{ token: string; session: SessionRecord }> {
    const token = SessionRepository.generateToken();
    const tokenHash = SessionRepository.hashToken(token);
    const session = await this.queryOne(
      `INSERT INTO platform.sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token_hash, expires_at`,
      [userId, tokenHash, expiresAt],
      mapSession,
    );
    if (!session) {
      throw new Error('Failed to create session');
    }
    return { token, session };
  }

  async findValidSession(token: string): Promise<SessionRecord | null> {
    const tokenHash = SessionRepository.hashToken(token);
    return this.queryOne(
      `SELECT id, user_id, token_hash, expires_at
       FROM platform.sessions
       WHERE token_hash = $1 AND expires_at > now()`,
      [tokenHash],
      mapSession,
    );
  }

  async deleteByToken(token: string): Promise<void> {
    const tokenHash = SessionRepository.hashToken(token);
    await this.execute(`DELETE FROM platform.sessions WHERE token_hash = $1`, [tokenHash]);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.execute(`DELETE FROM platform.sessions WHERE user_id = $1`, [userId]);
  }
}

function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tokenHash: row.token_hash as string,
    expiresAt: row.expires_at as Date,
  };
}
