import { useCallback } from 'react';
import { useIntl } from 'react-intl';

// Textos do chat. Português é o padrão; inglês vem embutido. O app sobrescreve qualquer chave nas mensagens do
// react-intl (C3ThemeProvider loadMessages).

import { CHAT_MESSAGES_EN } from './text.en';
import { CHAT_MESSAGES_PT, type ChatMessageId } from './text.pt';

export { CHAT_MESSAGES_EN };
export type { ChatMessageId };

/** `t('c3.chat.send')` no idioma atual: mensagem do app, senão a embutida (inglês ou português). */
export function useChatText() {
  const intl = useIntl();
  const en = intl.locale.toLowerCase().startsWith('en');
  return useCallback(
    (id: ChatMessageId, values?: Record<string, string | number>) =>
      intl.formatMessage({ id, defaultMessage: en ? CHAT_MESSAGES_EN[id] : CHAT_MESSAGES_PT[id] }, values),
    [intl, en]
  );
}
