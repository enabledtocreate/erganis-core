#!/usr/bin/env node
/**
 * Generate public API subset from core OpenAPI spec.
 * Keeps only operations with x-audience: public; writes to schemas/public/<version>/openapi.yaml.
 *
 * Usage: node generate-public-api.js [version]
 * Example: node generate-public-api.js v2
 * Default version: v1
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const corePath = path.join(repoRoot, 'schemas', 'core', 'openapi.yaml');
const version = process.argv[2] || 'v1';
const outDir = path.join(repoRoot, 'schemas', 'public', version);
const outPath = path.join(outDir, 'openapi.yaml');

let YAML;
try {
  YAML = require('yaml');
} catch (_) {
  console.error('Missing dependency. Run: npm install yaml');
  process.exit(1);
}

function filterPublicOnly(spec) {
  const out = JSON.parse(JSON.stringify(spec));
  out.paths = out.paths || {};
  const filtered = {};

  for (const [pathKey, pathItem] of Object.entries(out.paths)) {
    if (typeof pathItem !== 'object' || pathItem === null) continue;
    const methods = {};
    const otherKeys = {};
    for (const [key, value] of Object.entries(pathItem)) {
      const lower = key.toLowerCase();
      if (lower === 'get' || lower === 'put' || lower === 'post' || lower === 'delete' || lower === 'patch' || lower === 'options' || lower === 'head') {
        if (value && value['x-audience'] === 'public') {
          const opCopy = { ...value };
          delete opCopy['x-audience'];
          methods[key] = opCopy;
        }
      } else {
        otherKeys[key] = value;
      }
    }
    if (Object.keys(methods).length > 0) {
      filtered[pathKey] = { ...otherKeys, ...methods };
    }
  }

  out.paths = filtered;
  if (out.info) out.info.version = version.replace(/^v/, '') + '.0.0';
  return out;
}

if (!fs.existsSync(corePath)) {
  console.error('Core spec not found:', corePath);
  process.exit(1);
}

const coreContent = fs.readFileSync(corePath, 'utf8');
let spec;
try {
  spec = YAML.parse(coreContent);
} catch (e) {
  console.error('Failed to parse core OpenAPI YAML:', e.message);
  process.exit(1);
}

const publicSpec = filterPublicOnly(spec);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, YAML.stringify(publicSpec, { lineWidth: 0 }), 'utf8');
console.log('Wrote', outPath);
