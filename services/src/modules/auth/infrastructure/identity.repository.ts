import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

export interface OidcIdentityRecord {
  userId: string;
  issuer: string;
  subject: string;
}

@Injectable()
export class IdentityRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async findByIssuerSubject(
    issuer: string,
    subject: string,
  ): Promise<OidcIdentityRecord | null> {
    return this.queryOne(
      `SELECT user_id, issuer, subject
       FROM platform.oidc_identities
       WHERE issuer = $1 AND subject = $2`,
      [issuer, subject],
      (row) => ({
        userId: row.user_id as string,
        issuer: row.issuer as string,
        subject: row.subject as string,
      }),
    );
  }

  async linkIdentity(userId: string, issuer: string, subject: string): Promise<void> {
    await this.execute(
      `INSERT INTO platform.oidc_identities (user_id, provider_type, issuer, subject)
       VALUES ($1, 'oidc', $2, $3)
       ON CONFLICT (issuer, subject) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [userId, issuer, subject],
    );
  }
}
