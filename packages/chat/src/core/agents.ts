// Agentes na tela: o estado de cada um (doca) e os pedidos que esperam a pessoa (faixa do topo). Só dados e regras;
// a janela por cima dos outros apps, a rede e quem decide o estado ficam com o app.

/**
 * O que o agente está fazendo. `waiting`: espera a pessoa (aprovação, pergunta). `paused`: a pessoa pausou.
 * `done`: terminou e ainda não foi visto.
 */
export type AgentState = 'idle' | 'thinking' | 'talking' | 'working' | 'waiting' | 'paused' | 'error' | 'done';

export const AGENT_STATES: readonly AgentState[] = ['idle', 'thinking', 'talking', 'working', 'waiting', 'paused', 'error', 'done'];

/** Estados com movimento (pensando, falando, trabalhando): param quando o app pede `animate={false}` ou o sistema reduz movimento. */
export const isBusy = (state: AgentState) => state === 'thinking' || state === 'talking' || state === 'working';

/** Estados que pedem o olhar da pessoa: a doca destaca o item. */
export const needsAttention = (state: AgentState) => state === 'waiting' || state === 'error';

interface RequestBase {
  id: string;
  /** Agente que pediu: o "Abrir conversa" leva para a conversa dele. */
  agentId: string;
  agentName: string;
  /** O pedido, em texto para gente ("Enviar 3 lembretes de cobrança por e-mail?"). */
  text: string;
}

/** Pedido de aprovação: permitir uma vez, sempre permitir ou recusar. */
export interface ApprovalRequest extends RequestBase {
  kind: 'approval';
}

/** Pergunta com resposta em texto livre. */
export interface QuestionRequest extends RequestBase {
  kind: 'question';
  placeholder?: string;
}

/** Trabalho em andamento, que a pessoa pode parar. `progress` de 0 a 1; sem ele, a barra fica indeterminada. */
export interface ProgressRequest extends RequestBase {
  kind: 'progress';
  progress?: number;
}

/** Falha que a pessoa precisa ver; some ao dispensar. */
export interface FailureRequest extends RequestBase {
  kind: 'failure';
}

export type AgentRequest = ApprovalRequest | QuestionRequest | ProgressRequest | FailureRequest;

/** Pedidos que esperam uma ação da pessoa. Trabalho em andamento só informa e não conta. */
export const isPendingRequest = (r: AgentRequest) => r.kind !== 'progress';

export const pendingCount = (requests: readonly AgentRequest[]) => requests.filter(isPendingRequest).length;

const ORDER: Record<AgentRequest['kind'], number> = { approval: 0, question: 1, failure: 2, progress: 3 };

/**
 * Ordem da pilha na faixa: primeiro o que trava um agente (aprovação, pergunta), depois falha, por último o que só
 * informa. Dentro do mesmo tipo, a ordem em que chegaram.
 */
export const sortRequests = (requests: readonly AgentRequest[]) =>
  requests
    .map((r, i) => ({ r, i }))
    .sort((a, b) => ORDER[a.r.kind] - ORDER[b.r.kind] || a.i - b.i)
    .map(({ r }) => r);

/** Progresso entre 0 e 100 para a barra, ou `undefined` (indeterminada) quando não veio ou não é número. */
export const progressPercent = (progress: number | undefined) =>
  typeof progress === 'number' && Number.isFinite(progress) ? Math.round(Math.min(1, Math.max(0, progress)) * 100) : undefined;
