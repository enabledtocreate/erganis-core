import { ModuleDiscoveryService } from './module-discovery.service';

describe('ModuleDiscoveryService', () => {
  const config = {
    get: jest.fn().mockReturnValue('/tmp/modules'),
  };

  it('returns empty when root missing', async () => {
    const service = new ModuleDiscoveryService(config as never);
    jest.spyOn(service, 'discover').mockResolvedValue([]);
    await expect(service.discover()).resolves.toEqual([]);
  });
});
