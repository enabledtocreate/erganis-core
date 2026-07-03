import { CompositionController } from './composition.controller';

describe('CompositionController', () => {
  const themes = {
    resolvePlatform: jest.fn().mockReturnValue({ source: 'platform', designTokens: {}, componentSkins: [] }),
    resolveForOrg: jest.fn(),
    resolveWithOrgBase: jest.fn(),
    resolvePreview: jest.fn(),
    saveOrgTheme: jest.fn(),
  };
  const orgs = {
    findBySlug: jest.fn(),
  };
  const controller = new CompositionController(themes as never, orgs as never);

  it('lists default UI slots', () => {
    const result = controller.listSlots();
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0]).toHaveProperty('slotId');
  });

  it('returns platform theme when org is missing', async () => {
    orgs.findBySlug.mockResolvedValue(null);
    const result = await controller.getTheme('missing');
    expect(themes.resolvePlatform).toHaveBeenCalled();
    expect(result.orgSlug).toBe('missing');
  });
});
