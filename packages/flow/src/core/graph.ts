import type { FlowEdge, FlowGraph, FlowNode, FlowNodeType, FlowPosition } from './types';

// Operações puras sobre o grafo: cada uma devolve um grafo novo, o editor só chama e repassa ao onChange.

export const typeOf = (types: FlowNodeType[], node: FlowNode) => types.find((t) => t.type === node.type);

/** Nome do nó na tela: o rótulo dele, senão o do tipo, senão o id. */
export const nodeName = (types: FlowNodeType[], node: FlowNode) => node.label || typeOf(types, node)?.label || node.id;

/** Id que ainda não existe no grafo, com prefixo legível (`agente-3`). */
export function nextId(taken: Iterable<string>, prefix: string): string {
  const used = new Set(taken);
  for (let n = 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!used.has(id)) return id;
  }
}

export function addNode(graph: FlowGraph, type: FlowNodeType, position: FlowPosition): { graph: FlowGraph; id: string } {
  const id = nextId(
    graph.nodes.map((n) => n.id),
    type.type
  );
  const config = type.defaults?.();
  return { graph: { ...graph, nodes: [...graph.nodes, { id, type: type.type, position, ...(config && { config }) }] }, id };
}

/** O tipo ainda cabe no fluxo (sem `max`, sempre). */
export const canAdd = (graph: FlowGraph, type: FlowNodeType) =>
  type.max === undefined || graph.nodes.filter((n) => n.type === type.type).length < type.max;

/** O passo pode sair do fluxo: só não sai o de tipo com `removable: false`. */
export const isRemovable = (types: FlowNodeType[], node: FlowNode) => typeOf(types, node)?.removable !== false;

export function removeNodes(graph: FlowGraph, ids: string[]): FlowGraph {
  const gone = new Set(ids);
  return {
    nodes: graph.nodes.filter((n) => !gone.has(n.id)),
    edges: graph.edges.filter((e) => !gone.has(e.source) && !gone.has(e.target))
  };
}

export function removeEdges(graph: FlowGraph, ids: string[]): FlowGraph {
  const gone = new Set(ids);
  return { ...graph, edges: graph.edges.filter((e) => !gone.has(e.id)) };
}

/**
 * Liga a saída `sourcePort` de `source` à entrada de `target`. Cada saída leva a um só passo: ligar de novo troca o
 * destino. Ligação de um nó nele mesmo ou para um nó sem entrada (gatilho) é recusada (devolve o grafo igual).
 */
export function connect(graph: FlowGraph, types: FlowNodeType[], source: string, sourcePort: string, target: string): FlowGraph {
  const from = graph.nodes.find((n) => n.id === source);
  const to = graph.nodes.find((n) => n.id === target);
  if (!from || !to || source === target) return graph;
  if (!typeOf(types, to)?.hasInput) return graph;
  if (!typeOf(types, from)?.outputs.some((p) => p.id === sourcePort)) return graph;
  const others = graph.edges.filter((e) => !(e.source === source && e.sourcePort === sourcePort));
  const edge: FlowEdge = {
    id: nextId(
      graph.edges.map((e) => e.id),
      `${source}.${sourcePort}`
    ),
    source,
    sourcePort,
    target
  };
  return { ...graph, edges: [...others, edge] };
}

/** Desfaz a ligação da saída `port` de `node` (a saída fica livre). */
export function unlink(graph: FlowGraph, node: string, port: string): FlowGraph {
  return { ...graph, edges: graph.edges.filter((e) => !(e.source === node && e.sourcePort === port)) };
}

export function moveNode(graph: FlowGraph, id: string, position: FlowPosition): FlowGraph {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, position } : n)) };
}

export function updateNode(graph: FlowGraph, id: string, patch: Partial<Pick<FlowNode, 'label' | 'config'>>): FlowGraph {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) };
}

/** Ligação que sai de `node` pela saída `port`, se houver. */
export const edgeFrom = (graph: FlowGraph, node: string, port: string) =>
  graph.edges.find((e) => e.source === node && e.sourcePort === port);
