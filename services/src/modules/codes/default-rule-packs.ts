export interface CodeRuleInput {
  ruleFamily: 'ibc' | 'accessibility';
  jurisdiction: string;
  edition: string;
  topic: string;
  ruleKey: string;
  title: string;
  body?: string;
  numericValue?: number;
  unit?: string;
  metadata?: Record<string, unknown>;
  effectiveDate?: string;
}

export interface CodeRuleRecord extends CodeRuleInput {
  id: string;
}

/** Bootstrap rules for dev and offline demos until external sync is configured. */
export const DEFAULT_CODE_RULES: CodeRuleInput[] = [
  {
    ruleFamily: 'ibc',
    jurisdiction: 'US',
    edition: '2021',
    topic: 'occupancy',
    ruleKey: 'ibc.2021.occupancy.business_area_factor',
    title: 'Business area occupant load factor',
    body: 'Occupant load factor for business areas (gross).',
    numericValue: 150,
    unit: 'sqft_per_occupant',
    metadata: { occupancyGroup: 'B', useType: 'business' },
  },
  {
    ruleFamily: 'ibc',
    jurisdiction: 'US',
    edition: '2021',
    topic: 'occupancy',
    ruleKey: 'ibc.2021.occupancy.assembly_unconcentrated',
    title: 'Assembly unconcentrated load factor',
    body: 'Unconcentrated assembly without fixed seating.',
    numericValue: 15,
    unit: 'sqft_per_occupant',
    metadata: { occupancyGroup: 'A', useType: 'assembly' },
  },
  {
    ruleFamily: 'ibc',
    jurisdiction: 'US',
    edition: '2021',
    topic: 'egress',
    ruleKey: 'ibc.2021.egress.corridor_min_width',
    title: 'Minimum corridor width',
    body: 'Minimum egress corridor width for most occupancies.',
    numericValue: 44,
    unit: 'inches',
    metadata: { element: 'corridor' },
  },
  {
    ruleFamily: 'accessibility',
    jurisdiction: 'US',
    edition: '2017',
    topic: 'clearance',
    ruleKey: 'ada.turning_space_diameter',
    title: 'Wheelchair turning space',
    body: 'Circular turning space diameter.',
    numericValue: 60,
    unit: 'inches',
    metadata: { standard: 'ADA' },
  },
  {
    ruleFamily: 'accessibility',
    jurisdiction: 'US',
    edition: '2017',
    topic: 'clearance',
    ruleKey: 'ada.clear_floor_side_reach',
    title: 'Side reach clearance',
    body: 'Clear floor space for side approach.',
    numericValue: 30,
    unit: 'inches',
    metadata: { standard: 'ADA' },
  },
];
