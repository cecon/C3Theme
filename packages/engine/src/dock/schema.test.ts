import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { expect, it } from 'vitest';
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(readFileSync('spec/v0/app.schema.json', 'utf8')), 'app');
const validate = ajv.compile({ $ref: 'app#/$defs/agentDock' });
it('dock exige fonte, posição, tamanho limitado e texto; aceita i18n e vazio com ação', () => {
  const dock = {
    source: 'agents',
    position: 'bottom',
    size: 84,
    label: { id: 'agents' },
    states: { empty: { message: 'Vazio', action: { label: 'Abrir', path: '/novo' } } }
  };
  for (const position of ['bottom', 'top', 'right']) expect(validate({ ...dock, position })).toBe(true);
  for (const size of [0, -1, 481, 1.5]) expect(validate({ ...dock, size })).toBe(false);
  expect(validate({ ...dock, source: '' })).toBe(false);
  expect(validate({ ...dock, position: 'flutuante' })).toBe(false);
  expect(validate({ ...dock, overlay: true })).toBe(false);
  expect(validate({ ...dock, states: { empty: { message: 'Sem', action: { label: 'Sair', path: 'https://evil.invalid' } } } })).toBe(false);
});
