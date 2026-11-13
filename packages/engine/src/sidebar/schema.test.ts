import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { expect, it } from 'vitest';
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(readFileSync('spec/v0/app.schema.json', 'utf8')), 'app');
const validate = ajv.compile({ $ref: 'app#/$defs/sectionSidebar' });
const def = { source: 'equipe', label: { id: 'sidebar' }, title: 'Agentes', sections: [{ id: 'team', label: 'Time' }] };
it('sidebar é declarativa com rótulos traduzíveis e cartões por fonte', () => {
  expect(validate(def)).toBe(true);
  expect(
    validate({ ...def, cards: [{ id: 'storage', label: 'Espaço', dismissible: true, action: { id: 'open', label: { id: 'open' } } }] })
  ).toBe(true);
});
it('recusa fontes vazias, seções sem nome e ações sem rótulo', () => {
  expect(validate({ ...def, source: '' })).toBe(false);
  expect(validate({ ...def, sections: [{ id: 'x' }] })).toBe(false);
  expect(validate({ ...def, cards: [{ id: 'x', label: 'X', action: { id: 'open' } }] })).toBe(false);
  expect(validate({ ...def, executeScript: 'não' })).toBe(false);
});
