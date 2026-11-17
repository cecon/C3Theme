/** O que a aba mostra além do nome; também entra no nome acessível (nunca só cor). */
export type ThreadTabState = 'running' | 'waiting' | 'unread' | 'failed';

export interface ThreadTab {
  id: string;
  label: string;
  state?: ThreadTabState;
  /** Aba indisponível: fica desabilitada e o motivo vai no nome acessível e na dica. */
  disabled?: string;
  /** Padrão: dá para fechar. A thread principal passa `false`. */
  closable?: boolean;
}

export interface ThreadTabsProps {
  /** Nome acessível da faixa (o `aria-label` do tablist). */
  label: string;
  tabs: ThreadTab[];
  active: string;
  onSelect: (id: string) => void;
  /** Botão "+" no fim da faixa. Sem ele, não há botão. */
  onNew?: () => void;
  onClose?: (id: string) => void;
  onCloseOthers?: (id: string) => void;
  onRename?: (id: string, label: string) => void;
  /** Nova ordem completa dos ids (arrastar ou mover pelo menu). */
  onReorder?: (ids: string[]) => void;
  /** Threads fechadas que dá para reabrir pelo botão de lista. */
  closed?: { id: string; label: string }[];
  onReopen?: (id: string) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}
