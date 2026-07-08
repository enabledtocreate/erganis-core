#!/usr/bin/env node
/**
 * Validate erganis.module.json structural requirements (Core C15).
 * Usage: node validate-manifest.mjs <path-to-erganis.module.json>
 */
import { readFile } from 'fs/promises';
import path from 'path';

const manifestPath = process.argv[2];
if (!manifestPath) {
  console.error('Usage: validate-manifest.mjs <erganis.module.json>');
  process.exit(1);
}

const abs = path.resolve(manifestPath);
const raw = await readFile(abs, 'utf8');
const manifest = JSON.parse(raw);
const errors = [];

if (!manifest.id) errors.push('id is required');
if (!manifest.version) errors.push('version is required');
if (!manifest.entryPoint) errors.push('entryPoint is required');
if (!manifest.erganisCoreVersion) errors.push('erganisCoreVersion is required');

for (const [i, op] of (manifest.contributions?.operations ?? []).entries()) {
  const prefix = `contributions.operations[${i}]`;
  if (!op.surfaceId) errors.push(`${prefix}: surfaceId required`);
  if (!op.action) errors.push(`${prefix}: action required`);
  if (!op.stepId) errors.push(`${prefix}: stepId required`);
  if (!op.handler) errors.push(`${prefix}: handler required`);
  if (!op.failureClass) errors.push(`${prefix}: failureClass required`);
}

for (const [i, layout] of (manifest.contributions?.layout ?? []).entries()) {
  const prefix = `contributions.layout[${i}]`;
  if (!layout.surfaceId) errors.push(`${prefix}: surfaceId required`);
  if (!layout.path) errors.push(`${prefix}: path required`);
}

if (errors.length > 0) {
  console.error(`Manifest validation failed for ${abs}:`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log(`OK: ${abs} (${manifest.id}@${manifest.version})`);
