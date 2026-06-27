import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';

export interface SearchDocumentInput {
  orgId: string;
  entityType: string;
  entityPublicId: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchHit {
  entityType: string;
  entityPublicId: string;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  rank: number;
}

@Injectable()
export class SearchIndexRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async upsert(input: SearchDocumentInput): Promise<void> {
    await this.execute(
      `INSERT INTO platform.search_index
         (org_id, entity_type, entity_public_id, title, body, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
       ON CONFLICT (org_id, entity_type, entity_public_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         metadata = EXCLUDED.metadata,
         updated_at = now()`,
      [
        input.orgId,
        input.entityType,
        input.entityPublicId,
        input.title ?? null,
        input.body ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  }

  async search(orgId: string, query: string, limit: number): Promise<SearchHit[]> {
    return this.queryMany(
      `SELECT entity_type, entity_public_id, title, body, metadata,
              ts_rank(search_vector, plainto_tsquery('english', $2)) AS rank
       FROM platform.search_index
       WHERE org_id = $1
         AND search_vector @@ plainto_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT $3`,
      [orgId, query, limit],
      (row) => ({
        entityType: String(row.entity_type),
        entityPublicId: String(row.entity_public_id),
        title: row.title == null ? null : String(row.title),
        body: row.body == null ? null : String(row.body),
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        rank: Number(row.rank),
      }),
    );
  }
}
