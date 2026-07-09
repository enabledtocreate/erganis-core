import { stepHandlerKey } from '@erganis/platform';
import { SurfaceLoadService } from './surface-load.service';

describe('SurfaceLoadService', () => {
  const handler = jest.fn().mockResolvedValue({ title: 'Hello' });

  const loader = {
    getEnabledModules: jest.fn().mockReturnValue([
      {
        manifest: { id: 'erganis.hello-world' },
        operations: [
          { surfaceId: 'dashboard', action: 'load', stepId: 'hello-load', handler: 'pingLoad' },
        ],
      },
    ]),
    getHandlers: jest.fn().mockReturnValue(
      new Map([[stepHandlerKey('erganis.hello-world', 'pingLoad'), handler]]),
    ),
  };

  const orgs = {
    findBySlug: jest.fn().mockResolvedValue({
      id: 'org-1',
      publicId: 'org_1',
      slug: 'acme',
    }),
  };

  const moduleAccess = {
    assertOperationAllowed: jest.fn().mockResolvedValue(undefined),
  };

  const database = {
    getPool: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    }),
  };

  const service = new SurfaceLoadService(
    loader as never,
    orgs as never,
    moduleAccess as never,
    database as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads surface data from module load handlers', async () => {
    const result = await service.loadSurface('acme', 'dashboard', {});
    expect(moduleAccess.assertOperationAllowed).toHaveBeenCalledWith('org-1', 'dashboard', 'load');
    expect(result.surfaceId).toBe('dashboard');
    expect(result.modules['erganis.hello-world']).toEqual({ 'hello-load': { title: 'Hello' } });
  });

  it('throws when org is missing', async () => {
    orgs.findBySlug.mockResolvedValueOnce(null);
    await expect(service.loadSurface('missing', 'dashboard', {})).rejects.toThrow(
      'Organization not found',
    );
  });
});
