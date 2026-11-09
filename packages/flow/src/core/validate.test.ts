import { describe, expect, it } from 'vitest';

import { FLOW, TYPES } from './fixture.test-utils';
import { connect, removeEdges, updateNode } from './graph';
import { cycles, issuesByNode, validateFlow } from './validate';

describe('validateFlow', () => {
  it('fluxo completo não tem problema', () => {
    expect(validateFlow(FLOW, TYPES)).toEqual([]);
  });

  it('marca saída sem ligação com a saída', () => {
    const g = removeEdges(FLOW, ['e4']);
    expect(validateFlow(g, TYPES)).toEqual([{ code: 'unlinkedOutput', nodeId: 'confirmado', detail: 'nao' }]);
  });

  it('saída optional pode ficar solta (o fluxo termina ali)', () => {
    const g = removeEdges(FLOW, ['e4']);
    const types = TYPES.map((t) =>
      t.type === 'condicao' ? { ...t, outputs: t.outputs.map((p) => ({ ...p, optional: p.id === 'nao' })) } : t
    );
    expect(validateFlow(g, types)).toEqual([]);
  });

  it('nó sem nenhuma ligação é solto; entrada sem ligação é outro problema', () => {
    const g = {
      ...FLOW,
      nodes: [...FLOW.nodes, { id: 'solto', type: 'fim', position: { x: 0, y: 0 } }],
      edges: FLOW.edges.filter((e) => e.id !== 'e1')
    };
    const issues = validateFlow(g, TYPES);
    expect(issues).toContainEqual({ code: 'orphan', nodeId: 'solto' });
    expect(issues).toContainEqual({ code: 'missingInput', nodeId: 'atendente' });
    expect(issues).toContainEqual({ code: 'orphan', nodeId: 'zap' }); // sem a única ligação, o gatilho fica solto
  });

  it('ciclo sem limite marca todos os nós do ciclo; com limite no nó de condição passa', () => {
    const loop = connect(FLOW, TYPES, 'confirmado', 'nao', 'atendente');
    expect(
      validateFlow(loop, TYPES)
        .filter((i) => i.code === 'cycle')
        .map((i) => i.nodeId)
    ).toEqual(expect.arrayContaining(['atendente', 'confirmado']));
    const limited = updateNode(loop, 'confirmado', { config: { maxVoltas: 3 } });
    expect(validateFlow(limited, TYPES).some((i) => i.code === 'cycle')).toBe(false);
  });

  it('campo obrigatório vazio e tipo desconhecido', () => {
    const g = updateNode(FLOW, 'cozinha', { config: { agente: '  ' } });
    expect(validateFlow(g, TYPES)).toEqual([{ code: 'required', nodeId: 'cozinha', detail: 'agente' }]);
    const strange = { ...FLOW, nodes: FLOW.nodes.map((n) => (n.id === 'fim' ? { ...n, type: 'xyz' } : n)) };
    expect(validateFlow(strange, TYPES)).toContainEqual({ code: 'unknownType', nodeId: 'fim', detail: 'xyz' });
  });

  it('um nó só não é "solto"', () => {
    const single = { nodes: [FLOW.nodes[0]], edges: [] };
    expect(validateFlow(single, TYPES).map((i) => i.code)).toEqual(['unlinkedOutput']);
  });

  it('agrupa por nó', () => {
    const map = issuesByNode(validateFlow(removeEdges(FLOW, ['e3', 'e4']), TYPES));
    expect(map.get('confirmado')).toHaveLength(2);
  });
});

describe('cycles', () => {
  it('acha laço no próprio nó vindo do JSON', () => {
    const g = { ...FLOW, edges: [...FLOW.edges, { id: 'x', source: 'cozinha', sourcePort: 'out', target: 'cozinha' }] };
    expect(cycles(g)).toEqual([['cozinha']]);
  });
});
