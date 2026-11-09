import { useMemo } from 'react';

import type { CanvasEdge, CanvasEdgeTone, CanvasLabels, CanvasNode } from '../canvas/port';
import { nodeName } from '../core/graph';
import { traversedEdges } from '../core/run';
import type { FlowExtraIssue, FlowGraph, FlowIssue, FlowRun } from '../core/types';
import FlowNodeCard from './FlowNodeCard';
import { issueText, type FlowNodeKind } from './kinds';
import type { FlowText } from './text';

interface Input {
  graph: FlowGraph;
  kinds: FlowNodeKind[];
  run?: FlowRun;
  byNode: Map<string, FlowIssue[]>;
  extraIssues?: FlowExtraIssue[];
  selectedId: string | null;
  readOnly: boolean;
  t: FlowText;
}

/** Traduz o grafo, a execução e os problemas para o que a porta do canvas desenha (cartões prontos e ligações com tom). */
export function useCanvasModel({ graph, kinds, run, byNode, extraIssues, selectedId, readOnly, t }: Input) {
  const issueTexts = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const node of graph.nodes) {
      const texts = (byNode.get(node.id) ?? []).map((i) => issueText(t, kinds, node, i));
      // os do app vêm com o texto pronto, depois dos do editor
      for (const extra of extraIssues ?? []) if (extra.nodeId === node.id) texts.push(extra.message);
      if (texts.length) map.set(node.id, texts);
    }
    return map;
  }, [graph.nodes, byNode, extraIssues, kinds, t]);

  const nodes = useMemo<CanvasNode[]>(
    () =>
      graph.nodes.map((node) => {
        const kind = kinds.find((k) => k.type === node.type);
        const name = nodeName(kinds, node);
        const status = run?.status[node.id];
        const problems = issueTexts.get(node.id) ?? [];
        const aria = [t('c3.flow.nodeAria', { name, type: kind?.label ?? node.type })];
        if (status) aria.push(t(`c3.flow.status.${status}`));
        aria.push(...problems);
        return {
          id: node.id,
          position: node.position,
          hasInput: kind?.hasInput ?? true,
          outputs: kind?.outputs ?? [],
          ariaLabel: aria.join('. '),
          content: (
            <FlowNodeCard
              name={name}
              kind={kind}
              summary={kind?.summary?.(node)}
              status={status}
              issues={problems}
              selected={node.id === selectedId}
              t={t}
            />
          )
        };
      }),
    [graph.nodes, kinds, run, issueTexts, selectedId, t]
  );

  const edges = useMemo<CanvasEdge[]>(() => {
    const walked = traversedEdges(graph, run);
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    return graph.edges.map((e) => {
      const from = byId.get(e.source);
      const to = byId.get(e.target);
      const port = from && kinds.find((k) => k.type === from.type)?.outputs.find((p) => p.id === e.sourcePort);
      const source = from ? nodeName(kinds, from) : e.source;
      const target = to ? nodeName(kinds, to) : e.target;
      const targetStatus = run?.status[e.target];
      let tone: CanvasEdgeTone = 'default';
      if (walked.has(e.id))
        tone = targetStatus === 'failed' ? 'failed' : targetStatus === 'running' || targetStatus === 'waiting' ? 'active' : 'traversed';
      return {
        id: e.id,
        source: e.source,
        sourcePort: e.sourcePort,
        target: e.target,
        tone,
        ariaLabel: port?.label ? t('c3.flow.edgeAriaPort', { source, target, port: port.label }) : t('c3.flow.edgeAria', { source, target })
      };
    });
  }, [graph, kinds, run, t]);

  const labels = useMemo<CanvasLabels>(
    () => ({
      canvas: t('c3.flow.canvas'),
      zoomIn: t('c3.flow.zoomIn'),
      zoomOut: t('c3.flow.zoomOut'),
      fitView: t('c3.flow.fitView'),
      minimap: t('c3.flow.minimap'),
      node: t(readOnly ? 'c3.flow.nodeHelpReadOnly' : 'c3.flow.nodeHelp'),
      edge: t('c3.flow.edgeHelp'),
      handle: t('c3.flow.handle')
    }),
    [t, readOnly]
  );

  return { nodes, edges, labels, issueTexts };
}
