import { useCallback } from 'react';
import { useIntl } from 'react-intl';

// textos da faixa de abas; ficam aqui e não no i18n.ts para o arquivo geral não passar de 300 linhas
const PT = {
  'c3.tabs.new': 'Nova thread',
  'c3.tabs.list': 'Todas as abas',
  'c3.tabs.reopen': 'Reabrir',
  'c3.tabs.menu': 'Ações da aba {label}',
  'c3.tabs.rename': 'Renomear',
  'c3.tabs.renameTitle': 'Renomear aba',
  'c3.tabs.left': 'Mover para a esquerda',
  'c3.tabs.right': 'Mover para a direita',
  'c3.tabs.close': 'Fechar',
  'c3.tabs.closeOthers': 'Fechar as outras',
  'c3.tabs.closeTab': 'Fechar {label}',
  'c3.tabs.moved': '{label} na posição {at} de {total}',
  'c3.tabs.loading': 'Carregando threads',
  'c3.tabs.retry': 'Tentar de novo',
  'c3.tabs.state.running': 'executando',
  'c3.tabs.state.waiting': 'aguardando você',
  'c3.tabs.state.unread': 'resposta nova',
  'c3.tabs.state.failed': 'falhou',
  'c3.tabs.unavailable': 'indisponível: {reason}'
} as const;

export type ThreadTabsMessageId = keyof typeof PT;

export const THREAD_TABS_MESSAGES_EN: Record<ThreadTabsMessageId, string> = {
  'c3.tabs.new': 'New thread',
  'c3.tabs.list': 'All tabs',
  'c3.tabs.reopen': 'Reopen',
  'c3.tabs.menu': 'Actions for tab {label}',
  'c3.tabs.rename': 'Rename',
  'c3.tabs.renameTitle': 'Rename tab',
  'c3.tabs.left': 'Move left',
  'c3.tabs.right': 'Move right',
  'c3.tabs.close': 'Close',
  'c3.tabs.closeOthers': 'Close others',
  'c3.tabs.closeTab': 'Close {label}',
  'c3.tabs.moved': '{label} at position {at} of {total}',
  'c3.tabs.loading': 'Loading threads',
  'c3.tabs.retry': 'Try again',
  'c3.tabs.state.running': 'running',
  'c3.tabs.state.waiting': 'waiting for you',
  'c3.tabs.state.unread': 'new reply',
  'c3.tabs.state.failed': 'failed',
  'c3.tabs.unavailable': 'unavailable: {reason}'
};

/** `t('c3.tabs.new')` com o texto do idioma atual. */
export function useThreadTabsText() {
  const intl = useIntl();
  return useCallback(
    (id: ThreadTabsMessageId, values?: Record<string, string | number>) => intl.formatMessage({ id, defaultMessage: PT[id] }, values),
    [intl]
  );
}
