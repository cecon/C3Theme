// Fila de avisos sem React: quem mostra é o <Notifier />, que assina as mudanças.

export type NotifySeverity = 'success' | 'info' | 'warning' | 'error';

/** Botão no aviso, ex.: "Desfazer". Clicar roda `onClick` e fecha o aviso. */
export interface NotifyAction {
  label: string;
  onClick: () => void;
}

export interface Notice {
  id: number;
  message: string;
  severity: NotifySeverity;
  action?: NotifyAction;
  /** Quantas vezes o mesmo aviso chegou enquanto estava na tela. */
  count: number;
  /** Muda quando o aviso se repete: o tempo para fechar recomeça. */
  version: number;
}

/** Avisos na tela ao mesmo tempo; os demais esperam na ordem em que chegaram. */
export const MAX_VISIBLE = 3;

export interface QueueState {
  visible: Notice[];
  waiting: Notice[];
}

export const EMPTY: QueueState = { visible: [], waiting: [] };

const same = (a: Notice, b: Omit<Notice, 'id' | 'count' | 'version'>) =>
  a.message === b.message && a.severity === b.severity && a.action?.label === b.action?.label && !a.action === !b.action;

/**
 * Entra um aviso. Repetido (mesma mensagem e tipo) não empilha: soma no contador e recomeça o tempo do que já
 * está na fila, para um erro em laço não esconder os outros avisos.
 */
export function push(state: QueueState, notice: Omit<Notice, 'count' | 'version'>): QueueState {
  const bump = (list: Notice[]) =>
    list.map((n) => (same(n, notice) ? { ...n, count: n.count + 1, version: n.version + 1, action: notice.action } : n));
  if (state.visible.some((n) => same(n, notice))) return { ...state, visible: bump(state.visible) };
  if (state.waiting.some((n) => same(n, notice))) return { ...state, waiting: bump(state.waiting) };
  const entry: Notice = { ...notice, count: 1, version: 0 };
  return state.visible.length < MAX_VISIBLE
    ? { ...state, visible: [...state.visible, entry] }
    : { ...state, waiting: [...state.waiting, entry] };
}

/** Sai um aviso (fechado ou vencido); o primeiro da espera ocupa a vaga. */
export function dismiss(state: QueueState, id: number): QueueState {
  const visible = state.visible.filter((n) => n.id !== id);
  const waiting = state.waiting.filter((n) => n.id !== id);
  if (visible.length === state.visible.length && waiting.length === state.waiting.length) return state;
  const room = MAX_VISIBLE - visible.length;
  return { visible: [...visible, ...waiting.slice(0, room)], waiting: waiting.slice(room) };
}

/** Tempo na tela: erro e aviso com botão ficam mais, para dar tempo de ler e clicar. */
export const durationOf = (n: Pick<Notice, 'severity' | 'action'>) => (n.severity === 'error' || n.action ? 8000 : 4000);
