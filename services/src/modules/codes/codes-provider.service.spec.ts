import { CodesProviderService } from './codes-provider.service';
import { DEFAULT_CODE_RULES } from './default-rule-packs';

describe('CodesProviderService', () => {
  const rules = {
    countAll: jest.fn(),
    listRules: jest.fn(),
    upsertRule: jest.fn(),
    appendSyncLog: jest.fn(),
  };
  const database = { isConfigured: () => true };
  const service = new CodesProviderService(rules as never, database as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seeds default rules when table is empty', async () => {
    rules.countAll.mockResolvedValue(0);
    await service.ensureSeedData();
    expect(rules.upsertRule).toHaveBeenCalledTimes(DEFAULT_CODE_RULES.length);
    expect(rules.appendSyncLog).toHaveBeenCalledWith('platform.seed', '2021', DEFAULT_CODE_RULES.length);
  });

  it('skips seed when rules already exist', async () => {
    rules.countAll.mockResolvedValue(5);
    await service.ensureSeedData();
    expect(rules.upsertRule).not.toHaveBeenCalled();
  });

  it('queries rules with filters', async () => {
    rules.listRules.mockResolvedValue([]);
    await service.queryRules({ jurisdiction: 'US', topic: 'occupancy' });
    expect(rules.listRules).toHaveBeenCalledWith({ jurisdiction: 'US', topic: 'occupancy' });
  });
});
