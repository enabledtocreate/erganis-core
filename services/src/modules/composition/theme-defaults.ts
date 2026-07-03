export interface DesignTokens {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows?: Record<string, string>;
}

export interface ComponentSkinEntry {
  slotId: string;
  variant: string;
  density?: string;
  className?: string;
}

export interface ResolvedTheme {
  designTokens: DesignTokens;
  componentSkins: ComponentSkinEntry[];
  source: 'platform' | 'org' | 'preview';
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222 47% 11%)',
    primary: 'hsl(222 47% 11%)',
    primaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(210 40% 96%)',
    accent: 'hsl(210 40% 96%)',
    border: 'hsl(214 32% 91%)',
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
    heading: 'Inter, system-ui, sans-serif',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
  },
};

export const DEFAULT_COMPONENT_SKINS: ComponentSkinEntry[] = [
  { slotId: 'shell.header', variant: 'default', density: 'comfortable' },
  { slotId: 'shell.sidebar', variant: 'default', density: 'compact' },
  { slotId: 'shell.main', variant: 'default', density: 'comfortable' },
  { slotId: 'dashboard.widget', variant: 'card', density: 'comfortable' },
];

export function mergeDesignTokens(
  base: DesignTokens,
  override?: Partial<DesignTokens> | Record<string, unknown>,
): DesignTokens {
  if (!override) {
    return { ...base, colors: { ...base.colors }, fonts: { ...base.fonts } };
  }
  const o = override as Partial<DesignTokens>;
  return {
    colors: { ...base.colors, ...(o.colors ?? {}) },
    fonts: { ...base.fonts, ...(o.fonts ?? {}) },
    spacing: { ...base.spacing, ...(o.spacing ?? {}) },
    radii: { ...base.radii, ...(o.radii ?? {}) },
    shadows: { ...(base.shadows ?? {}), ...(o.shadows ?? {}) },
  };
}

export function mergeComponentSkins(
  base: ComponentSkinEntry[],
  override?: ComponentSkinEntry[],
): ComponentSkinEntry[] {
  if (!override?.length) {
    return [...base];
  }
  const bySlot = new Map(base.map((entry) => [entry.slotId, { ...entry }]));
  for (const entry of override) {
    bySlot.set(entry.slotId, { ...bySlot.get(entry.slotId), ...entry });
  }
  return [...bySlot.values()];
}
