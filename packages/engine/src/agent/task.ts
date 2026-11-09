// Qual tarefa cada parte do assistente é, para a telemetria do chat (`taskOf` do <AssistantPanel>). Mesmo
// vocabulário do motor na tela (entity, op, action), para comparar os dois canais. Puro: sem React.

import type { ActionPayload, RecordPayload } from './payload';
import type { TaskOp } from '../telemetry';

export interface AgentTask {
  entity: string;
  op: TaskOp;
  action?: string;
  /** Campos que a parte grava. */
  fields: number;
  /** Campos que o assistente sugeriu. */
  suggested: number;
}

const count = (o: unknown) => (o && typeof o === 'object' ? Object.keys(o).length : 0);

/** `c3.record` é create ou update; `c3.action` é action. `c3.form` só responde ao assistente: não é tarefa. */
export function agentTaskOf(part: { kind: string; payload: unknown }): AgentTask | null {
  const p = part.payload as Partial<RecordPayload & ActionPayload> | null;
  if (!p || typeof p.entity !== 'string') return null;
  if (part.kind === 'c3.record') {
    return { entity: p.entity, op: p.id ? 'update' : 'create', fields: count(p.values), suggested: count(p.suggested) };
  }
  if (part.kind === 'c3.action' && typeof p.action === 'string') {
    return { entity: p.entity, op: 'action', action: p.action, fields: count(p.input), suggested: count(p.suggested) };
  }
  return null;
}
