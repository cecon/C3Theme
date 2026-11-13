import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { expect, it } from 'vitest';

const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(readFileSync('spec/v0/app.schema.json', 'utf8')), 'app');
const settings = ajv.compile({ $ref: 'app#/$defs/settings' });
const control = ajv.compile({ $ref: 'app#/$defs/settingsControl' });
it('schema aceita políticas e condicionais dos dois modais', () => {
  expect(
    settings({
      title: 'Configurações',
      initialFocusRow: 'nome',
      restoreSection: true,
      sections: [{ id: 'geral', title: 'Geral', capability: 'remote', permission: '/config', platforms: ['desktop'] }],
      server: { title: 'Servidor', sections: [{ id: 'mcp', title: { id: 'mcp.title' } }] }
    })
  ).toBe(true);
  expect(settings({ title: 'Configurações', sections: [] })).toBe(false);
  expect(settings({ title: 'Configurações', sections: [{ id: 'geral', title: 'Geral', platforms: ['watch'] }] })).toBe(false);
});
it('schema exige controles completos e valores do tipo certo', () => {
  for (const value of [
    { type: 'action' },
    { type: 'page', label: 'Abrir' },
    { type: 'select' },
    { type: 'slider', min: 0, max: 10, step: 0 },
    { type: 'switch', value: 'sim' },
    { type: 'text', value: false }
  ])
    expect(control(value)).toBe(false);
  for (const value of [
    { type: 'switch', value: true, readOnly: true },
    { type: 'select', options: [{ value: 'pt', label: 'Português' }] },
    { type: 'text', value: 'Ana', readOnly: false },
    { type: 'action', label: 'Executar' }
  ])
    expect(control(value)).toBe(true);
});
