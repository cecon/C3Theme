import { typeOf } from './graph';
import type { FlowGraph, FlowIssue, FlowNode, FlowNodeType } from './types';

/** Componentes fortemente conexos (Tarjan) com mais de um nó, ou com laço no próprio nó: são os ciclos do grafo. */
export function cycles(graph: FlowGraph): string[][] {
  const next = new Map<string, string[]>(graph.nodes.map((n) => [n.id, []]));
  for (const e of graph.edges) next.get(e.source)?.push(e.target);
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const found: string[][] = [];
  let counter = 0;

  const visit = (v: string) => {
    index.set(v, counter);
    low.set(v, counter++);
    stack.push(v);
    onStack.add(v);
    for (const w of next.get(v) ?? []) {
      if (!next.has(w)) continue;
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) low.set(v, Math.min(low.get(v)!, index.get(w)!));
    }
    if (low.get(v) !== index.get(v)) return;
    const scc: string[] = [];
    let w: string;
    do {
      w = stack.pop()!;
      onStack.delete(w);
      scc.push(w);
    } while (w !== v);
    if (scc.length > 1 || next.get(v)!.includes(v)) found.push(scc);
  };
  for (const n of graph.nodes) if (!index.has(n.id)) visit(n.id);
  return found;
}

const hasLimit = (types: FlowNodeType[], node: FlowNode) => {
  const key = typeOf(types, node)?.loopLimitKey;
  return !!key && Number(node.config?.[key]) > 0;
};

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/**
 * Problemas do fluxo, por nó: tipo desconhecido, nó solto (sem nenhuma ligação), entrada sem ligação (o passo nunca
 * roda), saída sem ligação, ciclo sem limite e campo obrigatório vazio. Lista vazia: o fluxo pode ser publicado.
 */
export function validateFlow(graph: FlowGraph, types: FlowNodeType[]): FlowIssue[] {
  const issues: FlowIssue[] = [];
  const incoming = new Set(graph.edges.map((e) => e.target));
  const outgoing = new Set(graph.edges.map((e) => `${e.source}\0${e.sourcePort}`));
  const linked = new Set(graph.edges.flatMap((e) => [e.source, e.target]));

  for (const node of graph.nodes) {
    const type = typeOf(types, node);
    if (!type) {
      issues.push({ code: 'unknownType', nodeId: node.id, detail: node.type });
      continue;
    }
    if (!linked.has(node.id) && graph.nodes.length > 1) {
      issues.push({ code: 'orphan', nodeId: node.id });
    } else {
      if (type.hasInput && !incoming.has(node.id)) issues.push({ code: 'missingInput', nodeId: node.id });
      for (const port of type.outputs) {
        if (!outgoing.has(`${node.id}\0${port.id}`)) issues.push({ code: 'unlinkedOutput', nodeId: node.id, detail: port.id });
      }
    }
    for (const field of type.fields ?? []) {
      if (field.required && isEmpty(node.config?.[field.key])) issues.push({ code: 'required', nodeId: node.id, detail: field.key });
    }
  }

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  for (const scc of cycles(graph)) {
    if (scc.some((id) => hasLimit(types, byId.get(id)!))) continue;
    for (const id of scc) issues.push({ code: 'cycle', nodeId: id });
  }
  return issues;
}

/** Problemas agrupados por nó, para marcar cada um no canvas. */
export function issuesByNode(issues: FlowIssue[]): Map<string, FlowIssue[]> {
  const map = new Map<string, FlowIssue[]>();
  for (const issue of issues) map.set(issue.nodeId, [...(map.get(issue.nodeId) ?? []), issue]);
  return map;
}
