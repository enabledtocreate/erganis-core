#!/usr/bin/env node
/**
 * Compile erganis.module.yaml → erganis.module.json
 * Usage: node scripts/compile-module-manifest.js <path/to/erganis.module.yaml> [--out path]
 */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node compile-module-manifest.js <erganis.module.yaml> [--out path]');
  process.exit(1);
}

let outPath = inputPath.replace(/\.ya?ml$/i, '.json');
const outIdx = process.argv.indexOf('--out');
if (outIdx !== -1 && process.argv[outIdx + 1]) {
  outPath = process.argv[outIdx + 1];
}

const raw = fs.readFileSync(path.resolve(inputPath), 'utf8');
const doc = yaml.parse(raw);
fs.writeFileSync(path.resolve(outPath), JSON.stringify(doc, null, 2) + '\n');
console.log(`Wrote ${outPath}`);
