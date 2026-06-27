import { SearchService } from './search.service';

describe('SearchService', () => {
  const index = {
    upsert: jest.fn(),
    search: jest.fn().mockResolvedValue([]),
  };
  const service = new SearchService(index as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('indexes completed operations for FTS', async () => {
    await service.indexOperation({
      orgId: 'org-1',
      operationId: 'op_1',
      surfaceId: 'stub',
      action: 'save',
      outcome: 'success',
    });
    expect(index.upsert).toHaveBeenCalledWith({
      orgId: 'org-1',
      entityType: 'operation',
      entityPublicId: 'op_1',
      title: 'stub.save',
      body: 'success',
      metadata: { surfaceId: 'stub', action: 'save', outcome: 'success' },
    });
  });

  it('upserts arbitrary search documents from job payload', async () => {
    await service.upsertDocument({
      orgId: 'org-1',
      entityType: 'document',
      entityPublicId: 'doc_1',
      title: 'Spec',
      body: 'Requirements text',
    });
    expect(index.upsert).toHaveBeenCalled();
  });
});
