import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { expect, it } from 'vitest';
const schema = JSON.parse(readFileSync('spec/v0/app.schema.json', 'utf8'));
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8')));
ajv.addSchema(schema, 'app');
const validate = ajv.compile({ $ref: 'app#/$defs/chat' });
it('pinned opt-in e meta escalar na spec, sem filtros executáveis ou estruturas aninhadas', () => {
  for (const pinned of [true, false, { label: { id: 'pinned' } }]) {
    expect(
      validate({
        pinned,
        messageActions: [{ id: 'fixar', label: 'Fixar', when: { meta: { fixada: false, n: 3, name: 'a', empty: null } } }]
      })
    ).toBe(true);
  }
  expect(validate({ pinned: { wrong: true } })).toBe(false);
  expect(validate({ messageActions: [{ id: 'fixar', label: 'Fixar', when: { meta: { nested: {} } } }] })).toBe(false);
  expect(validate({ messageActions: [{ id: 'fixar', label: 'Fixar', when: { meta: {} } }] })).toBe(false);
});
