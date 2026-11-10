// Leitura do openapi.json da página apiDocs (#33): $ref, grupos por tag, busca e URL do "experimentar".
import { describe, expect, it } from 'vitest';

import { buildUrl, filterGroups, groupOperations, resolveRefs } from './openapi';

const doc = {
  tags: [{ name: 'Clientes', description: 'Cadastro' }, { name: 'Vazia' }],
  paths: {
    '/cliente/{id}': {
      parameters: [{ $ref: '#/components/parameters/id' }],
      get: {
        tags: ['Clientes'],
        summary: 'Lê o cliente',
        parameters: [{ name: 'campos', in: 'query' }, { in: 'query' }],
        responses: { '200': { $ref: '#/components/responses/Cliente' } }
      },
      patch: {
        tags: ['Clientes'],
        operationId: 'alterar',
        requestBody: { required: true, content: { 'application/json': { examples: { a: { value: { nome: 'Ana' } } } } } },
        responses: {}
      }
    },
    '/saude': { get: { summary: 'Situação do serviço', responses: { '200': { description: 'ok', content: { 'text/plain': {} } } } } }
  },
  components: {
    parameters: { id: { name: 'id', in: 'path', schema: { type: 'string', example: '7' } } },
    responses: { Cliente: { description: 'O cliente', content: { 'application/json': { schema: { $ref: '#/components/schemas/C' } } } } },
    schemas: {
      C: { type: 'object', example: { id: '1' }, properties: { pai: { $ref: '#/components/schemas/C' } } },
      'a/b': { type: 'string' }
    }
  }
};

describe('openapi da página apiDocs', () => {
  it('resolve $ref, com ciclo e ref inexistente preservados', () => {
    const r = resolveRefs(doc, { $ref: '#/components/schemas/C' }) as Record<string, unknown>;
    expect(r.type).toBe('object');
    expect(JSON.stringify(r)).toContain('"$ref":"#/components/schemas/C"');
    expect(resolveRefs(doc, { $ref: '#/components/schemas/x' })).toEqual({ $ref: '#/components/schemas/x' });
    expect(resolveRefs(doc, { $ref: '#/components/schemas/a~1b' })).toEqual({ type: 'string' });
    expect(resolveRefs(doc, [1, 'a'])).toEqual([1, 'a']);
  });

  it('agrupa por tag na ordem do documento; sem tag vai para Outras; tag vazia some', () => {
    const groups = groupOperations(doc);
    expect(groups.map((g) => g.tag)).toEqual(['Clientes', 'Outras']);
    const [get, patch] = groups[0].operations;
    expect(get.id).toBe('get /cliente/{id}');
    expect(get.params.map((p) => [p.name, p.in, p.required, p.example])).toEqual([
      ['id', 'path', true, '7'],
      ['campos', 'query', false, undefined]
    ]);
    expect(get.responses[0]).toMatchObject({ status: '200', description: 'O cliente', example: { id: '1' } });
    expect(patch.body).toEqual({ schema: undefined, example: { nome: 'Ana' }, required: true });
    expect(groups[1].operations[0].responses[0].example).toBeUndefined();
    expect(groupOperations({})).toEqual([]);
  });

  it('busca por caminho, resumo ou id, sem acento', () => {
    const groups = groupOperations(doc);
    expect(filterGroups(groups, '')).toBe(groups);
    expect(filterGroups(groups, 'situacao').map((g) => g.tag)).toEqual(['Outras']);
    expect(filterGroups(groups, 'ALTERAR')[0].operations.map((o) => o.method)).toEqual(['patch']);
    expect(filterGroups(groups, 'nada')).toEqual([]);
  });

  it('monta a URL com a rota e a query, sem parâmetro vazio', () => {
    const op = groupOperations(doc)[0].operations[0];
    expect(buildUrl(op, { id: 'a b', campos: '' })).toBe('/cliente/a%20b');
    expect(buildUrl(op, { id: '1', campos: 'nome' })).toBe('/cliente/1?campos=nome');
  });
});
