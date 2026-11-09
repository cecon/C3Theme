#!/usr/bin/env node
// Uso: c3-conformance <url-base-da-api>     ex.: c3-conformance http://127.0.0.1:3000/api

import { buildSuite } from './suite.mjs';

const base = process.argv[2];
if (!base) {
  console.error('uso: c3-conformance <url-base-da-api>   (ex.: http://127.0.0.1:3000/api)');
  process.exit(2);
}

const { tests, tag } = buildSuite(base);
console.log(`conformidade C3 v0 contra ${base} (etiqueta ${tag})\n`);

let failed = 0;
for (const t of tests) {
  try {
    await t.fn();
    console.log(`  ok    [${t.group}] ${t.name}`);
  } catch (e) {
    failed++;
    console.log(`  FALHA [${t.group}] ${t.name}\n        ${String(e.message).split('\n').join('\n        ')}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} passaram`);
process.exit(failed ? 1 : 0);
