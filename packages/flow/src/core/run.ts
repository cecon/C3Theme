import type { FlowGraph, FlowRun, NodeRunStatus } from './types';

const REACHED: NodeRunStatus[] = ['running', 'waiting', 'done', 'failed'];

/**
 * Ligações percorridas na execução. Com `run.traversed`, vale a lista do app (ele sabe qual saída da condição saiu).
 * Sem ela, conta a ligação cujo nó de origem terminou (`done`) e cujo destino já foi alcançado.
 */
export function traversedEdges(graph: FlowGraph, run?: FlowRun): Set<string> {
  if (!run) return new Set();
  if (run.traversed) return new Set(run.traversed);
  const status = (id: string) => run.status[id] ?? 'idle';
  return new Set(graph.edges.filter((e) => status(e.source) === 'done' && REACHED.includes(status(e.target))).map((e) => e.id));
}

/** Contagem por situação, para o resumo da execução (ex.: "3 concluídos, 1 em andamento"). */
export function runSummary(graph: FlowGraph, run?: FlowRun): Record<NodeRunStatus, number> {
  const summary: Record<NodeRunStatus, number> = { idle: 0, running: 0, waiting: 0, done: 0, failed: 0 };
  for (const n of graph.nodes) summary[run?.status[n.id] ?? 'idle']++;
  return summary;
}
