import { describe, expect, it } from 'vitest';

import { FLOW, TYPES } from './fixture.test-utils';
import { addNode, canAdd, connect, edgeFrom, isRemovable, moveNode, nextId, nodeName, removeNodes, unlink } from './graph';
import { autoLayout } from './layout';
import { runSummary, traversedEdges } from './run';

describe('operações do grafo', () => {
  it('nextId pula os ids usados', () => {
    expect(nextId(['agente-1', 'agente-2'], 'agente')).toBe('agente-3');
  });

  it('canAdd respeita max e isRemovable o removable: false', () => {
    const gatilho = { ...TYPES[0], max: 1, removable: false };
    expect(canAdd(FLOW, gatilho)).toBe(false);
    expect(canAdd(FLOW, { ...TYPES[1], max: 3 })).toBe(true);
    expect(canAdd(FLOW, TYPES[1])).toBe(true);
    expect(isRemovable([gatilho, ...TYPES.slice(1)], FLOW.nodes[0])).toBe(false);
    expect(isRemovable(TYPES, FLOW.nodes[0])).toBe(true);
  });

  it('addNode cria nó com id do tipo', () => {
    const { graph, id } = addNode(FLOW, TYPES[1], { x: 10, y: 20 });
    expect(id).toBe('agente-1');
    expect(graph.nodes.at(-1)).toEqual({ id, type: 'agente', position: { x: 10, y: 20 } });
  });

  it('removeNodes leva junto as ligações do nó', () => {
    const g = removeNodes(FLOW, ['confirmado']);
    expect(g.edges.map((e) => e.id)).toEqual(['e1', 'e5']);
  });

  it('connect troca o destino da mesma saída e recusa ligação inválida', () => {
    const g = connect(FLOW, TYPES, 'confirmado', 'nao', 'cozinha');
    expect(edgeFrom(g, 'confirmado', 'nao')?.target).toBe('cozinha');
    expect(g.edges.filter((e) => e.source === 'confirmado')).toHaveLength(2);
    expect(connect(FLOW, TYPES, 'cozinha', 'out', 'zap')).toBe(FLOW); // gatilho não tem entrada
    expect(connect(FLOW, TYPES, 'cozinha', 'out', 'cozinha')).toBe(FLOW);
    expect(connect(FLOW, TYPES, 'cozinha', 'inexistente', 'fim')).toBe(FLOW);
  });

  it('unlink deixa a saída livre', () => {
    expect(edgeFrom(unlink(FLOW, 'confirmado', 'sim'), 'confirmado', 'sim')).toBeUndefined();
  });

  it('moveNode e nodeName', () => {
    expect(moveNode(FLOW, 'fim', { x: 5, y: 6 }).nodes.at(-1)?.position).toEqual({ x: 5, y: 6 });
    expect(nodeName(TYPES, FLOW.nodes[0])).toBe('Mensagem no WhatsApp');
    expect(nodeName(TYPES, FLOW.nodes[2])).toBe('Condição');
  });
});

describe('autoLayout', () => {
  it('põe cada passo numa coluna depois da do anterior', () => {
    const g = autoLayout(FLOW, { columnGap: 100, rowGap: 50 });
    const x = Object.fromEntries(g.nodes.map((n) => [n.id, n.position.x]));
    expect(x).toEqual({ zap: 0, atendente: 100, confirmado: 200, cozinha: 300, fim: 400 });
  });

  it('não trava com ciclo e não sobrepõe nós', () => {
    const loop = connect(FLOW, TYPES, 'confirmado', 'nao', 'atendente');
    const g = autoLayout(loop);
    const spots = new Set(g.nodes.map((n) => `${n.position.x},${n.position.y}`));
    expect(spots.size).toBe(g.nodes.length);
    expect(g.nodes.find((n) => n.id === 'zap')!.position.x).toBe(0);
  });
});

describe('execução', () => {
  const run = { status: { zap: 'done', atendente: 'done', confirmado: 'done', cozinha: 'running' } as const };

  it('deduz o caminho pela situação dos nós', () => {
    expect([...traversedEdges(FLOW, run)]).toEqual(['e1', 'e2', 'e3']);
  });

  it('usa a lista do app quando vem', () => {
    expect([...traversedEdges(FLOW, { ...run, traversed: ['e1'] })]).toEqual(['e1']);
    expect(traversedEdges(FLOW).size).toBe(0);
  });

  it('resume por situação', () => {
    expect(runSummary(FLOW, run)).toEqual({ idle: 1, running: 1, waiting: 0, done: 3, failed: 0 });
  });
});
