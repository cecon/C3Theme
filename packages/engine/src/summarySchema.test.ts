import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { expect, it } from 'vitest';
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(readFileSync('spec/v0/app.schema.json', 'utf8')), 'app');
const validate = ajv.compile({ $ref: 'app#/$defs/dashboard' });
it('valida resumo sem entidade e preserva widget de entidade', () => {
  expect(
    validate({
      source: { path: '/uso' },
      widgets: [
        {
          type: 'summary-kpi',
          title: { id: 'tokens' },
          value: 'tokens',
          items: 'providers',
          label: 'name',
          progress: { label: 'Limite', limit: 'limit' }
        },
        { type: 'summary-ranking', title: 'Agentes', items: 'agents', label: 'name', value: 'tokens', share: 'percent' },
        {
          type: 'summary-object',
          title: 'Versão',
          state: 'state',
          fields: [],
          states: { beta: { label: 'Beta', warning: 'Teste' } },
          warnings: [{ field: 'channel', equals: 'beta', message: 'Teste' }],
          actions: [{ label: 'Baixar', path: '/download', disabled: 'disabled', instruction: 'why' }]
        },
        { type: 'kpi', title: 'Pedidos', entity: 'pedido' }
      ]
    })
  ).toBe(true);
});
it('recusa endpoint externo, barra dupla, ações incompletas e entidade no resumo', () => {
  for (const path of ['https://other', '//other', '/\\other', '/uso#x']) expect(validate({ source: { path }, widgets: [] })).toBe(false);
  expect(validate({ widgets: [{ type: 'summary-kpi', title: 'KPI', value: 'tokens', entity: 'x' }] })).toBe(false);
  expect(
    validate({ widgets: [{ type: 'summary-object', title: 'O', state: 'state', states: {}, fields: [], actions: [{ label: 'Ir' }] }] })
  ).toBe(false);
});
