import type { ReactNode } from 'react';

import ActionPart from './ActionPart';
import FormPart from './FormPart';
import type { AgentPartProps } from './part';
import RecordPart from './RecordPart';

/**
 * Catálogo do motor para as partes de interface do assistente: passe em `<AssistantPanel uiRenderers>` (do
 * @c3theme/chat), dentro do `<C3Shell>` ou de um `EngineProvider`. Só estes `kind` existem; o resto vira aviso.
 */
export const agentUiRenderers: Record<'c3.form' | 'c3.record' | 'c3.action', (props: AgentPartProps) => ReactNode> = {
  'c3.form': FormPart,
  'c3.record': RecordPart,
  'c3.action': ActionPart
};

export { FormPart, RecordPart, ActionPart };
export { checkAction, checkForm, checkRecord, forbiddenForAgent } from './payload';
export type { ActionPayload, FormPayload, RecordPayload, Suggested } from './payload';
export type { AgentAnswer, AgentPartProps } from './part';
export { agentTaskOf } from './task';
export type { AgentTask } from './task';
