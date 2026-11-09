import type { FlowGraph, FlowPosition } from './types';

export interface LayoutOptions {
  /** Distância entre colunas (da esquerda para a direita, na ordem dos passos). */
  columnGap?: number;
  /** Distância entre nós da mesma coluna. */
  rowGap?: number;
}

/** Ligações que fecham ciclo (voltam para um nó já na pilha da busca): ficam fora do cálculo das colunas. */
function backEdges(graph: FlowGraph, next: Map<string, string[]>): Set<string> {
  const back = new Set<string>();
  const state = new Map<string, 'open' | 'done'>();
  const visit = (v: string) => {
    state.set(v, 'open');
    for (const w of next.get(v) ?? []) {
      if (state.get(w) === 'open') back.add(`${v}\0${w}`);
      else if (!state.has(w)) visit(w);
    }
    state.set(v, 'done');
  };
  const incoming = new Set(graph.edges.map((e) => e.target));
  // começa pelos gatilhos (sem entrada) para o ciclo ser cortado na volta, não na ida
  const roots = [...graph.nodes.filter((n) => !incoming.has(n.id)), ...graph.nodes];
  for (const n of roots) if (!state.has(n.id)) visit(n.id);
  return back;
}

/**
 * Organiza automaticamente em camadas (da esquerda para a direita): a coluna de cada nó é o caminho mais longo desde
 * um gatilho, sem as ligações de volta dos ciclos; dentro da coluna, a ordem segue a média das posições dos nós que
 * apontam para ele (menos cruzamentos). Implementação própria, sem dependência de biblioteca de layout.
 */
export function autoLayout(graph: FlowGraph, { columnGap = 280, rowGap = 140 }: LayoutOptions = {}): FlowGraph {
  const ids = graph.nodes.map((n) => n.id);
  const next = new Map<string, string[]>(ids.map((id) => [id, []]));
  const known = new Set(ids);
  for (const e of graph.edges) if (known.has(e.source) && known.has(e.target)) next.get(e.source)!.push(e.target);
  const back = backEdges(graph, next);
  const forward = graph.edges.filter((e) => known.has(e.source) && known.has(e.target) && !back.has(`${e.source}\0${e.target}`));

  // camadas por caminho mais longo, em ordem topológica (Kahn)
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const e of forward) indegree.set(e.target, indegree.get(e.target)! + 1);
  const layer = new Map<string, number>(ids.map((id) => [id, 0]));
  const queue = ids.filter((id) => indegree.get(id) === 0);
  for (let i = 0; i < queue.length; i++) {
    const v = queue[i];
    for (const e of forward.filter((f) => f.source === v)) {
      layer.set(e.target, Math.max(layer.get(e.target)!, layer.get(v)! + 1));
      indegree.set(e.target, indegree.get(e.target)! - 1);
      if (indegree.get(e.target) === 0) queue.push(e.target);
    }
  }

  const columns: string[][] = [];
  for (const id of queue) (columns[layer.get(id)!] ??= []).push(id);
  const row = new Map<string, number>();
  columns.forEach((col, c) => {
    if (c > 0) {
      const score = (id: string) => {
        const parents = forward.filter((e) => e.target === id && row.has(e.source)).map((e) => row.get(e.source)!);
        return parents.length ? parents.reduce((a, b) => a + b, 0) / parents.length : Number.MAX_SAFE_INTEGER;
      };
      col.sort((a, b) => score(a) - score(b));
    }
    col.forEach((id, r) => row.set(id, r));
  });

  const tallest = Math.max(1, ...columns.map((c) => c.length));
  const position = new Map<string, FlowPosition>();
  columns.forEach((col, c) => {
    const offset = ((tallest - col.length) * rowGap) / 2;
    col.forEach((id, r) => position.set(id, { x: c * columnGap, y: offset + r * rowGap }));
  });
  return { ...graph, nodes: graph.nodes.map((n) => ({ ...n, position: position.get(n.id) ?? n.position })) };
}
