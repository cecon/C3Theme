// Asserções do contrato usadas por todas as suítes: formato de erro, erro por campo e JSON Schema da spec.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const specDir = join(dirname(fileURLToPath(import.meta.url)), '../../../spec/v0');
const readJson = (name) => JSON.parse(readFileSync(join(specDir, name), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(readJson('entity.schema.json'), 'entity.schema.json');
ajv.addSchema(readJson('app.schema.json'), 'app.schema.json');

const ERROR_CODES = [
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'refused',
  'stale',
  'validation_failed',
  'internal'
];
export const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export function assertSchema(id, data) {
  const fn = ajv.getSchema(id);
  assert.ok(fn(data), `não valida contra ${id}: ${ajv.errorsText(fn.errors)}`);
}

export function assertError(res, status, code) {
  assert.equal(res.status, status, `esperado HTTP ${status}, veio ${res.status}: ${JSON.stringify(res.body)}`);
  const err = res.body?.error;
  assert.ok(err && typeof err.message === 'string' && err.message.length > 0, 'erro sem error.message');
  assert.ok(ERROR_CODES.includes(err.code), `error.code desconhecido: ${err?.code}`);
  assert.equal(err.code, code);
  return err;
}

export function assertFieldError(res, field, code, status = 422) {
  const err = assertError(res, status, status === 409 ? 'conflict' : 'validation_failed');
  const list = err.fields?.[field];
  assert.ok(Array.isArray(list) && list.length > 0, `sem error.fields.${field}: ${JSON.stringify(err)}`);
  assert.ok(
    list.some((e) => e.code === code && typeof e.message === 'string'),
    `esperado ${field}: ${code}, veio ${JSON.stringify(list)}`
  );
}
