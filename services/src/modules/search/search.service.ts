import { Injectable } from '@nestjs/common';
import { SearchDocumentInput, SearchIndexRepository } from './search.repository';

@Injectable()
export class SearchService {
  constructor(private readonly index: SearchIndexRepository) {}

  async upsertDocument(payload: Record<string, unknown>): Promise<void> {
    const input = this.parseDocumentPayload(payload);
    if (!input) {
      return;
    }
    await this.index.upsert(input);
  }

  async indexOperation(payload: Record<string, unknown>): Promise<void> {
    const orgId = String(payload.orgId ?? '');
    const operationId = String(payload.operationId ?? '');
    if (!orgId || !operationId) {
      return;
    }
    const surfaceId = String(payload.surfaceId ?? '');
    const action = String(payload.action ?? '');
    const outcome = String(payload.outcome ?? '');
    await this.index.upsert({
      orgId,
      entityType: 'operation',
      entityPublicId: operationId,
      title: `${surfaceId}.${action}`,
      body: outcome,
      metadata: {
        surfaceId,
        action,
        outcome,
      },
    });
  }

  async search(orgId: string, query: string, limit = 20) {
    return this.index.search(orgId, query, limit);
  }

  private parseDocumentPayload(payload: Record<string, unknown>): SearchDocumentInput | null {
    const orgId = String(payload.orgId ?? '');
    const entityType = String(payload.entityType ?? '');
    const entityPublicId = String(payload.entityPublicId ?? '');
    if (!orgId || !entityType || !entityPublicId) {
      return null;
    }
    return {
      orgId,
      entityType,
      entityPublicId,
      title: payload.title == null ? undefined : String(payload.title),
      body: payload.body == null ? undefined : String(payload.body),
      metadata:
        payload.metadata && typeof payload.metadata === 'object'
          ? (payload.metadata as Record<string, unknown>)
          : undefined,
    };
  }
}
