// Editor de fluxo pela spec (#72): o grafo no campo text e os tipos de passo da spec no contrato do @c3theme/flow.
import { describe, expect, it } from 'vitest';

import { EMPTY_FLOW, flowKinds, flowPath, parseFlow, serializeFlow } from './flow';
import { defaultColumns } from './format';
import type { EntityDef, Text } from './types';
import type { FlowView } from './viewTypes';

const text = (t: Text | undefined, fallback = '') => (t === undefined ? fallback : typeof t === 'string' ? t : `#${t.id}`);
const GRAPH = {
  nodes: [
    { id: 'a', type: 'gatilho', position: { x: 0, y: 0 } },
    { id: 'b', type: 'fim', position: { x: 300, y: 0 }, label: 'Fim', config: { x: 1 } }
  ],
  edges: [{ id: 'e1', source: 'a', sourcePort: 'out', target: 'b' }]
};

describe('parseFlow', () => {
  it('vazio, null ou só espaço é fluxo sem passos', () => {
    for (const v of [undefined, null, '', '   ']) expect(parseFlow(v)).toBe(EMPTY_FLOW);
  });

  it('lê o JSON gravado e devolve só nodes e edges', () => {
    expect(parseFlow(JSON.stringify({ ...GRAPH, extra: true }))).toEqual(GRAPH);
    expect(parseFlow(GRAPH)).toEqual(GRAPH);
  });

  it('JSON quebrado ou fora do formato não é fluxo', () => {
    const bad = [
      '{',
      'null',
      '[]',
      '{"nodes":[]}',
      '{"edges":[]}',
      JSON.stringify({ nodes: [null], edges: [] }),
      JSON.stringify({ nodes: [{ id: '', type: 'x', position: { x: 0, y: 0 } }], edges: [] }),
      JSON.stringify({ nodes: [{ id: 'a', type: 'x', position: { x: 0 } }], edges: [] }),
      JSON.stringify({ nodes: [{ id: 'a', type: 'x' }], edges: [] }),
      JSON.stringify({ nodes: [{ id: 'a', position: { x: 0, y: 0 } }], edges: [] }),
      JSON.stringify({ nodes: [], edges: [null] }),
      JSON.stringify({ nodes: [], edges: [{ id: 'e', source: 'a', sourcePort: 'out' }] }),
      JSON.stringify({ nodes: [], edges: [{ id: 'e', source: 'a', target: 'b' }] })
    ];
    for (const v of bad) expect(parseFlow(v), v).toBeUndefined();
  });
});

describe('serializeFlow e flowPath', () => {
  it('grava só nodes e edges, sem espaço', () => {
    const text = serializeFlow({ ...GRAPH, extra: 1 } as never);
    expect(text).toBe(JSON.stringify(GRAPH));
    expect(text).not.toContain(' ');
  });

  it('a rota do editor escapa o id', () => {
    expect(flowPath('automacao', 'a b/1')).toBe('/automacao/a%20b%2F1/flow');
  });
});

describe('flowKinds', () => {
  const view: FlowView = {
    field: 'grafo',
    kinds: [
      { type: 'gatilho', label: 'Gatilho', icon: 'Flash', tone: 'warning', input: false, max: 1, removable: false },
      {
        type: 'condicao',
        label: { id: 'k.cond', defaultMessage: 'Condição' },
        outputs: [
          { id: 'sim', label: 'sim' },
          { id: 'nao', label: 'não', optional: true }
        ],
        fields: [
          { key: 'regra', label: 'Regra', required: true, help: 'Ex.: pedido.ok' },
          { key: 'voltas', label: 'Voltas', kind: 'number' }
        ],
        loopLimit: 'voltas',
        summary: 'regra'
      },
      {
        type: 'agente',
        label: 'Agente',
        fields: [{ key: 'agente', label: 'Agente', kind: 'select', options: [{ value: 'cozinha', label: 'Cozinha' }] }],
        summary: 'agente',
        defaults: { agente: 'cozinha' }
      },
      { type: 'fim', label: 'Fim', outputs: [], summary: 'nada' }
    ]
  };
  const icon = (name: string | undefined) => (name ? `icone:${name}` : undefined);
  const [gatilho, condicao, agente, fim] = flowKinds(view, text, icon);

  it('gatilho: sem entrada, uma saída padrão, ícone do catálogo e as regras do tipo', () => {
    expect(gatilho).toMatchObject({ type: 'gatilho', label: 'Gatilho', tone: 'warning', icon: 'icone:Flash', hasInput: false });
    expect(gatilho.outputs).toEqual([{ id: 'out', label: undefined, optional: undefined }]);
    expect(gatilho).toMatchObject({ max: 1, removable: false, fields: undefined, defaults: undefined, summary: undefined });
  });

  it('condição: textos traduzidos, saídas com rótulo, campos com padrão text e limite de voltas', () => {
    expect(condicao.label).toBe('#k.cond');
    expect(condicao.hasInput).toBe(true);
    expect(condicao.icon).toBeUndefined();
    expect(condicao.outputs).toEqual([
      { id: 'sim', label: 'sim', optional: undefined },
      { id: 'nao', label: 'não', optional: true }
    ]);
    expect(condicao.fields).toEqual([
      { key: 'regra', label: 'Regra', kind: 'text', options: undefined, required: true, helperText: 'Ex.: pedido.ok' },
      { key: 'voltas', label: 'Voltas', kind: 'number', options: undefined, required: undefined, helperText: undefined }
    ]);
    expect(condicao.loopLimitKey).toBe('voltas');
    const node = (config?: Record<string, unknown>) => ({ id: 'n', type: 'condicao', position: { x: 0, y: 0 }, config });
    expect(condicao.summary!(node({ regra: 'pedido.ok' }))).toBe('pedido.ok');
    for (const v of [undefined, null, '']) expect(condicao.summary!(node({ regra: v }))).toBeUndefined();
    expect(condicao.summary!(node())).toBeUndefined();
  });

  it('agente: select mostra o rótulo da opção no cartão; o valor fora da lista sai como está; defaults novos a cada passo', () => {
    const node = (agente: string) => ({ id: 'n', type: 'agente', position: { x: 0, y: 0 }, config: { agente } });
    expect(agente.fields![0].options).toEqual([{ value: 'cozinha', label: 'Cozinha' }]);
    expect(agente.summary!(node('cozinha'))).toBe('Cozinha');
    expect(agente.summary!(node('outro'))).toBe('outro');
    const first = agente.defaults!();
    expect(first).toEqual({ agente: 'cozinha' });
    first.agente = 'mudou';
    expect(agente.defaults!()).toEqual({ agente: 'cozinha' });
  });

  it('fim: sem saídas; summary que não está em fields não monta resumo', () => {
    expect(fim.outputs).toEqual([]);
    expect(fim.summary).toBeUndefined();
  });
});

describe('lista por convenção', () => {
  it('o campo do grafo não vira coluna; sem views.flow, o text entra como antes', () => {
    const fields = ['grafo', 'nome', 'a', 'b', 'c', 'd'].map((name) => ({ name, type: name === 'grafo' ? 'text' : 'string' }));
    const def = { name: 'x', fields, views: { flow: { field: 'grafo', kinds: [] } } } as unknown as EntityDef;
    expect(defaultColumns(def)).toEqual(['nome', 'a', 'b', 'c', 'd']);
    expect(defaultColumns({ ...def, views: undefined })).toEqual(['grafo', 'nome', 'a', 'b', 'c']);
  });
});
