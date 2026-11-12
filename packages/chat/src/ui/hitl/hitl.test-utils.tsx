import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import type { Message } from '../../core/types';
import type { UiPart } from '../../core/ui';

const theme = createTheme({ cssVariables: true });

/** Tema e textos, como no app. `onError` vazio: sem ele o vitest estoura a memória serializando o erro de chave. */
export const wrap = (ui: ReactNode, locale = 'pt-BR') =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale={locale} onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

export const message: Message = {
  id: 'm1',
  conversationId: 'c1',
  author: { id: 'bot', name: 'Assistente' },
  direction: 'in',
  createdAt: '2026-11-12T10:00:00Z'
};

export const partOf = (kind: string, payload: unknown, extra: Partial<UiPart> = {}): UiPart => ({ id: 'p1', kind, payload, ...extra });

export const answering = () => vi.fn().mockResolvedValue(true);
