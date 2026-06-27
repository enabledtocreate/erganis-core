import { BaseRepository } from './base-repository';
import { QueryClient } from './query-client';

class TestRepository extends BaseRepository {
  findOne(id: string) {
    return this.queryOne(
      'SELECT id, display_name FROM platform.users WHERE id = $1',
      [id],
      (row) => ({ id: row.id as string, name: row.display_name as string }),
    );
  }

  tableRef() {
    return this.qualifiedTable('inventory', 'widgets');
  }
}

describe('BaseRepository', () => {
  const client: QueryClient = {
    query: jest.fn(),
  };

  const repo = new TestRepository(client);

  beforeEach(() => jest.clearAllMocks());

  it('queryOne returns null when rowCount is zero', async () => {
    (client.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });
    await expect(repo.findOne('missing')).resolves.toBeNull();
  });

  it('queryOne maps a row', async () => {
    (client.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 'u1', display_name: 'Ada' }],
      rowCount: 1,
    });
    await expect(repo.findOne('u1')).resolves.toEqual({ id: 'u1', name: 'Ada' });
  });

  it('qualifiedTable builds schema.table', () => {
    expect(repo.tableRef()).toBe('inventory.widgets');
  });

  it('qualifiedTable rejects invalid names', () => {
    expect(() => repo['qualifiedTable']('bad-schema!', 'users')).toThrow(
      'Invalid schema or table name',
    );
  });
});
