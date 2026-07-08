import { AgentCapabilitiesService } from './agent-capabilities.service';
import { AgentController } from './agent.controller';

describe('AgentController', () => {
  const capabilities = {
    buildCapabilities: jest.fn(),
  };
  const controller = new AgentController(capabilities as never);

  it('delegates to capabilities service', async () => {
    capabilities.buildCapabilities.mockResolvedValue({
      orgSlug: 'acme',
      surfaces: [],
    });
    const result = await controller.getCapabilities('acme');
    expect(capabilities.buildCapabilities).toHaveBeenCalledWith('acme');
    expect(result.orgSlug).toBe('acme');
  });
});

describe('AgentCapabilitiesService', () => {
  const loader = { getEnabledModules: jest.fn().mockReturnValue([]) };
  const orgs = { findBySlug: jest.fn().mockResolvedValue(null) };
  const orgModules = {
    isModuleEnabled: jest.fn(),
    isOperationDisabled: jest.fn(),
  };
  const service = new AgentCapabilitiesService(
    loader as never,
    orgs as never,
    orgModules as never,
  );

  it('returns schema refs and endpoints', async () => {
    const result = await service.buildCapabilities('demo');
    expect(result.schemas.length).toBeGreaterThan(0);
    expect(result.endpoints.execute).toContain('/operations/execute');
  });
});
