// Editor de fluxo do registro (views.flow, issue #72): o grafo no campo text e os tipos de passo da spec viram o
// contrato do @c3theme/flow. Sem React na lógica; a tela fica em pages/flow.

import type { ReactNode } from 'react';

import type { FlowEdge, FlowGraph, FlowNode, FlowNodeKind } from '@c3theme/flow';

import type { Text } from './types';
import type { FlowKindDef, FlowView } from './viewTypes';

export const EMPTY_FLOW: FlowGraph = { nodes: [], edges: [] };

const isText = (v: unknown): v is string => typeof v === 'string' && v !== '';
const isPoint = (p: FlowNode['position'] | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
const isNode = (n: unknown): n is FlowNode => {
  const node = n as FlowNode | null;
  return !!node && isText(node.id) && isText(node.type) && isPoint(node.position);
};
const isEdge = (e: unknown): e is FlowEdge => {
  const edge = e as FlowEdge | null;
  return !!edge && [edge.id, edge.source, edge.sourcePort, edge.target].every(isText);
};

/** O grafo gravado no campo (JSON). Vazio é fluxo sem passos; JSON quebrado ou fora do formato devolve `undefined`. */
export function parseFlow(value: unknown): FlowGraph | undefined {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return EMPTY_FLOW;
  let parsed: unknown;
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return undefined;
  }
  const graph = parsed as Partial<FlowGraph> | null;
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return undefined;
  if (!graph.nodes.every(isNode) || !graph.edges.every(isEdge)) return undefined;
  return { nodes: graph.nodes, edges: graph.edges };
}

/** O que vai para o campo text no PATCH: só `nodes` e `edges`, sem espaço. */
export const serializeFlow = (graph: FlowGraph) => JSON.stringify({ nodes: graph.nodes, edges: graph.edges });

/** Rota do editor do registro. */
export const flowPath = (entity: string, id: string) => `/${entity}/${encodeURIComponent(id)}/flow`;

type TextFn = (t: Text | undefined, fallback?: string) => string;

/** Linha do cartão: o valor de `summary` no `config` do passo; em select, o rótulo da opção. */
function summaryOf(def: FlowKindDef, text: TextFn): FlowNodeKind['summary'] {
  const field = def.fields?.find((f) => f.key === def.summary);
  if (!field) return undefined;
  return (node) => {
    const value = node.config?.[field.key];
    if (value === undefined || value === null || value === '') return undefined;
    const option = field.options?.find((o) => o.value === value);
    return option ? text(option.label, option.value) : String(value);
  };
}

/** Tipos de passo da spec no formato do editor: textos traduzidos, ícone do catálogo e as regras de cada tipo. */
export function flowKinds(view: FlowView, text: TextFn, icon: (name: string | undefined) => ReactNode): FlowNodeKind[] {
  return view.kinds.map((def) => {
    const defaults = def.defaults;
    return {
      type: def.type,
      label: text(def.label, def.type),
      tone: def.tone,
      icon: icon(def.icon),
      hasInput: def.input !== false,
      outputs: (def.outputs ?? [{ id: 'out' }]).map((p) => ({
        id: p.id,
        label: p.label === undefined ? undefined : text(p.label, p.id),
        optional: p.optional
      })),
      fields: def.fields?.map((f) => ({
        key: f.key,
        label: text(f.label, f.key),
        kind: f.kind ?? 'text',
        options: f.options?.map((o) => ({ value: o.value, label: text(o.label, o.value) })),
        required: f.required,
        helperText: f.help === undefined ? undefined : text(f.help)
      })),
      loopLimitKey: def.loopLimit,
      max: def.max,
      removable: def.removable,
      defaults: defaults ? () => structuredClone(defaults) : undefined,
      summary: summaryOf(def, text)
    };
  });
}
