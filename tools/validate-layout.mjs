#!/usr/bin/env node
/**
 * Validate a *.layout.json file against structural rules (Core C15/C16).
 * Usage: node validate-layout.mjs <path-to-layout.json> [expectedSurfaceId]
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const LAYOUT_NODE_TYPES = new Set([
  'stack', 'grid', 'tabs', 'panel', 'slot', 'component', 'region',
]);

function validateNode(node, label, errors) {
  if (!node || typeof node !== 'object') {
    errors.push(`${label}: node must be an object`);
    return;
  }
  if (!node.type || !LAYOUT_NODE_TYPES.has(node.type)) {
    errors.push(`${label}: invalid type "${node.type}"`);
    return;
  }
  if (node.type === 'slot' && !node.slotId) {
    errors.push(`${label}: slotId required`);
  }
  if (node.type === 'component' && !node.component) {
    errors.push(`${label}: component required`);
  }
  if (node.type === 'grid' && (!node.columns || node.columns < 1)) {
    errors.push(`${label}: columns required for grid`);
  }
  for (const [i, child] of (node.children ?? []).entries()) {
    validateNode(child, `${label}.children[${i}]`, errors);
  }
}

function validateLayout(doc, expectedSurfaceId, source) {
  const errors = [];
  if (!doc || typeof doc !== 'object') {
    errors.push(`${source}: must be an object`);
    return errors;
  }
  if (!doc.surfaceId) errors.push(`${source}: surfaceId required`);
  else if (expectedSurfaceId && doc.surfaceId !== expectedSurfaceId) {
    errors.push(`${source}: surfaceId mismatch`);
  }
  if (!doc.version || !/^\d+\.\d+\.\d+/.test(doc.version)) {
    errors.push(`${source}: version must be semver`);
  }
  if (!doc.root) errors.push(`${source}: root required`);
  else validateNode(doc.root, `${source}.root`, errors);
  return errors;
}

const layoutPath = process.argv[2];
const expectedSurfaceId = process.argv[3];

if (!layoutPath) {
  console.error('Usage: validate-layout.mjs <layout.json> [expectedSurfaceId]');
  process.exit(1);
}

const abs = path.resolve(layoutPath);
const raw = await readFile(abs, 'utf8');
const doc = JSON.parse(raw);
const errors = validateLayout(doc, expectedSurfaceId, abs);

if (errors.length > 0) {
  console.error('Layout validation failed:');
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log(`OK: ${abs}`);
