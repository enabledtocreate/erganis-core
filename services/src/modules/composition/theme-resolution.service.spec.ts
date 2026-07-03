import { ThemeResolutionService } from './theme-resolution.service';

describe('ThemeResolutionService', () => {
  const repo = {
    findByOrgId: jest.fn(),
    upsert: jest.fn(),
  };
  const service = new ThemeResolutionService(repo as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns platform defaults when org has no overrides', async () => {
    repo.findByOrgId.mockResolvedValue(null);
    const theme = await service.resolveForOrg('org-1');
    expect(theme.source).toBe('platform');
    expect(theme.designTokens.colors.primary).toBeDefined();
    expect(theme.componentSkins.length).toBeGreaterThan(0);
  });

  it('merges org token and skin overrides', async () => {
    repo.findByOrgId.mockResolvedValue({
      orgId: 'org-1',
      designTokens: { colors: { primary: 'hsl(200 50% 40%)' } },
      componentSkins: [{ slotId: 'shell.header', variant: 'inverted' }],
    });
    const theme = await service.resolveForOrg('org-1');
    expect(theme.source).toBe('org');
    expect(theme.designTokens.colors.primary).toBe('hsl(200 50% 40%)');
    expect(theme.componentSkins.find((s) => s.slotId === 'shell.header')?.variant).toBe(
      'inverted',
    );
  });

  it('previews draft tokens without persisting', () => {
    const theme = service.resolvePreview({
      designTokens: { fonts: { sans: 'Georgia, serif' } },
    });
    expect(theme.source).toBe('preview');
    expect(theme.designTokens.fonts.sans).toBe('Georgia, serif');
  });
});
