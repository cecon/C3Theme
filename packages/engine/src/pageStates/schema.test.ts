import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { expect, it } from 'vitest';
import { checkPageStates } from '../../../../scripts/spec-page-states.mjs';

const schema = JSON.parse(readFileSync('spec/v0/app.schema.json', 'utf8'));
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('spec/v0/entity.schema.json', 'utf8')));
ajv.addSchema(schema, 'app');
const validate = ajv.compile({ $ref: 'app#/$defs/pageStates' });
const states = {
  loading: { message: { id: 'loading' } },
  empty: { message: 'Sem pedidos', action: { label: 'Novo', path: '/pedido/new' } },
  error: { message: 'Falhou', action: { label: 'Repetir', retry: true } },
  forbidden: { message: 'Sem acesso', instruction: 'Peça acesso' },
  offline: { message: 'Sem rede', works: ['Dados locais'] }
};
it('aceita os cinco estados e ação de registro, sem permitir destinos misturados', () => {
  expect(validate(states)).toBe(true);
  const next = structuredClone(states);
  next.empty.action = { label: 'Executar', record: { entity: 'pedido', id: '1', action: 'enviar' } } as never;
  expect(validate(next)).toBe(true);
  Object.assign(next.empty.action, { path: '/outra' });
  expect(validate(next)).toBe(false);
});
it('states opt-in exige contrato completo, textos e detalhes dos cinco estados', () => {
  for (const key of Object.keys(states)) {
    const next = { ...states };
    delete next[key as keyof typeof next];
    expect(validate(next)).toBe(false);
  }
  expect(validate({ ...states, loading: { message: '   ' } })).toBe(false);
  expect(validate({ ...states, empty: { message: 'Vazio' } })).toBe(false);
  expect(validate({ ...states, error: { message: 'Erro', action: { label: 'Ir', path: '/' } } })).toBe(false);
  expect(validate({ ...states, forbidden: { message: 'Não' } })).toBe(false);
  expect(validate({ ...states, offline: { message: 'Offline', works: [] } })).toBe(false);
});

it('validador cruza entidade e ação de registro do destino', () => {
  const errors: string[] = [];
  const record = { entity: 'pedido', id: '1', action: 'enviar' };
  const app = { entities: ['pedido'], pages: [{ path: '/dados', states: { empty: { action: { record } } } }] };
  const entities = new Map([['pedido', { entity: { actions: [{ name: 'enviar' }, { name: 'lote', target: 'list' }] } }]]);
  checkPageStates(app, entities, errors);
  expect(errors).toEqual([]);
  record.action = 'lote';
  checkPageStates(app, entities, errors);
  expect(errors.join()).toContain('lote');
  record.action = 'ausente';
  checkPageStates(app, entities, errors);
  expect(errors.join()).toContain('ausente');
  record.entity = 'ausente';
  checkPageStates(app, entities, errors);
  expect(errors.join()).toContain('ausente');
  checkPageStates({}, entities, errors);
  checkPageStates({ pages: [{ path: '/sem-estados' }] }, entities, errors);
});
