import type { ReactNode } from 'react';

import type { StatusTone, Tone } from '@c3theme/ui';

import type { FlowGraph, FlowIssue, FlowNode, FlowNodeType, NodeRunStatus } from '../core/types';
import type { FlowText } from './text';

/** Tipo de nó do editor: o tipo do contrato mais a aparência e, se o app quiser, um formulário próprio. */
export interface FlowNodeKind extends FlowNodeType {
  /** Cor do ícone do tipo (gatilho, agente...). */
  tone?: Tone;
  icon?: ReactNode;
  /** Resumo de uma linha no cartão (ex.: o agente escolhido). */
  summary?: (node: FlowNode) => string | undefined;
  /** Formulário próprio, no lugar dos `fields` (ou depois deles). */
  renderConfig?: (props: {
    node: FlowNode;
    readOnly: boolean;
    onChange: (config: Record<string, unknown>) => void;
    graph: FlowGraph;
  }) => ReactNode;
}

export const STATUS_TONE: Record<NodeRunStatus, StatusTone> = {
  idle: 'neutral',
  running: 'primary',
  waiting: 'warning',
  done: 'success',
  failed: 'danger'
};

/** Texto do problema para o nó, o painel e o leitor de tela. */
export function issueText(t: FlowText, kinds: FlowNodeKind[], node: FlowNode | undefined, issue: FlowIssue): string {
  const kind = node && kinds.find((k) => k.type === node.type);
  switch (issue.code) {
    case 'unlinkedOutput': {
      const port = kind?.outputs.find((p) => p.id === issue.detail);
      return port?.label ? t('c3.flow.issue.unlinkedOutput', { port: port.label }) : t('c3.flow.issue.unlinkedNext');
    }
    case 'required':
      return t('c3.flow.issue.required', { field: kind?.fields?.find((f) => f.key === issue.detail)?.label ?? issue.detail ?? '' });
    case 'unknownType':
      return t('c3.flow.issue.unknownType', { type: issue.detail ?? '' });
    default:
      return t(`c3.flow.issue.${issue.code}`);
  }
}
