// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import UserMenu from './UserMenu';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const user = { name: 'Eduardo Cecon', email: 'eduardo@exemplo.com', onLogout: vi.fn() };
const wrap = (placement: 'header' | 'drawer' | 'drawer-mini') =>
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MemoryRouter>
          <UserMenu {...user} placement={placement} />
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );

describe('UserMenu', () => {
  it('no pé do menu mostra nome e e-mail no cartão, sem indicador de status', () => {
    wrap('drawer');
    const card = screen.getByRole('button', { name: /Eduardo Cecon/ });
    expect(card.textContent).toContain('eduardo@exemplo.com');
    expect(card.getAttribute('aria-haspopup')).toBe('menu');
    expect(card.getAttribute('aria-expanded')).toBe('false');
  });

  it('o cartão abre o menu de conta sem repetir nome e e-mail', () => {
    wrap('drawer');
    fireEvent.click(screen.getByRole('button', { name: /Eduardo Cecon/ }));
    const menu = screen.getByRole('menu');
    expect(menu.textContent).not.toContain('eduardo@exemplo.com');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sair' }));
    expect(user.onLogout).toHaveBeenCalled();
  });

  it('com o menu recolhido, o avatar abre o menu com nome e e-mail', () => {
    wrap('drawer-mini');
    fireEvent.click(screen.getByRole('button', { name: /Eduardo Cecon/ }));
    expect(screen.getByRole('menu').textContent).toContain('eduardo@exemplo.com');
  });
});
