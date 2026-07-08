import { readFile } from 'fs/promises';
import path from 'path';

const LAYOUT_NODE_TYPES = new Set([
  'stack',
  'grid',
  'tabs',
  'panel',
  'slot',
  'component',
  'region',
]);

export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SurfaceLayoutDocument {
  surfaceId: string;
  version: string;
  title?: string;
  moduleId?: string;
  root: LayoutNode;
}

export interface LayoutNode {
  type: string;
  id?: string;
  title?: string;
  direction?: string;
  columns?: number;
  slotId?: string;
  component?: string;
  children?: LayoutNode[];
  props?: Record<string, unknown>;
}

export async function validateLayoutFile(
  layoutPath: string,
  expectedSurfaceId?: string,
): Promise<LayoutValidationResult> {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    const raw = await readFile(layoutPath, 'utf8');
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read layout ${layoutPath}: ${(error as Error).message}`],
    };
  }

  validateLayoutDocument(parsed, expectedSurfaceId, layoutPath, errors);
  return { valid: errors.length === 0, errors };
}

export function validateLayoutDocument(
  doc: unknown,
  expectedSurfaceId: string | undefined,
  source: string,
  errors: string[] = [],
): void {
  if (!doc || typeof doc !== 'object') {
    errors.push(`${source}: layout must be an object`);
    return;
  }

  const layout = doc as Record<string, unknown>;
  if (typeof layout.surfaceId !== 'string' || !layout.surfaceId) {
    errors.push(`${source}: surfaceId is required`);
  } else if (expectedSurfaceId && layout.surfaceId !== expectedSurfaceId) {
    errors.push(
      `${source}: surfaceId "${layout.surfaceId}" does not match manifest "${expectedSurfaceId}"`,
    );
  }

  if (typeof layout.version !== 'string' || !/^\d+\.\d+\.\d+/.test(layout.version)) {
    errors.push(`${source}: version must be semver (e.g. 1.0.0)`);
  }

  if (!layout.root || typeof layout.root !== 'object') {
    errors.push(`${source}: root node is required`);
    return;
  }

  validateLayoutNode(layout.root as LayoutNode, `${source}.root`, errors);
}

function validateLayoutNode(node: LayoutNode, pathLabel: string, errors: string[]): void {
  if (!node.type || !LAYOUT_NODE_TYPES.has(node.type)) {
    errors.push(`${pathLabel}: invalid or missing type "${node.type}"`);
    return;
  }

  if (node.type === 'slot' && !node.slotId) {
    errors.push(`${pathLabel}: slotId required for type slot`);
  }
  if (node.type === 'component' && !node.component) {
    errors.push(`${pathLabel}: component required for type component`);
  }
  if (node.type === 'grid' && (node.columns === undefined || node.columns < 1)) {
    errors.push(`${pathLabel}: columns required for type grid`);
  }

  for (const [index, child] of (node.children ?? []).entries()) {
    validateLayoutNode(child, `${pathLabel}.children[${index}]`, errors);
  }
}

export function resolveContractsRoot(): string {
  return path.resolve(process.cwd(), '../contracts');
}
