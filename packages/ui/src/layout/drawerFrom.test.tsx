// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import C3ThemeProvider from '../C3ThemeProvider';
import AppLayout from './AppLayout';
import type { DesktopOptions } from './desktop';
import type { NavGroup } from './nav';

// o jsdom não tem matchMedia: aqui ele responde `(min-width:Npx)` pela largura que o teste escolhe
let windowWidth = 1240;
beforeEach(() => {
  window.scrollTo = () => {};
  localStorage.clear();
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const matches = (!min || windowWidth >= Number(min[1])) && (!max || windowWidth <= Number(max[1]));
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false
    };
  }) as typeof window.matchMedia;
});
afterEach(cleanup);

const menu: NavGroup[] = [{ id: 'g', items: [{ id: 'ini', title: 'Início', url: '/' }] }];

function shell(desktop?: DesktopOptions) {
  return render(
    <C3ThemeProvider>
      <MemoryRouter>
        <AppLayout menu={menu} documentTitle={false} breadcrumbs={false} desktop={desktop}>
          conteúdo
        </AppLayout>
      </MemoryRouter>
    </C3ThemeProvider>
  );
}

// menu fixo = Drawer permanente (MuiDrawer-docked); gaveta = temporária, fechada e fora da tela
const pinned = () => document.querySelector('.MuiDrawer-docked') !== null;

describe('AppLayout: menu fixo pela largura da janela', () => {
  it('no app de desktop, 900 px já mostra o menu fixo (padrão 720 px)', () => {
    windowWidth = 900;
    shell({ platform: 'mac' });
    expect(pinned()).toBe(true);
    expect(screen.getByText('Início')).toBeTruthy();
  });

  it('o botão de menu recolhe o menu fixo (miniDrawer) e não abre gaveta', () => {
    windowWidth = 900;
    shell({ platform: 'mac' });
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(pinned()).toBe(true);
    expect(screen.queryByText('Início')).toBeNull();
  });

  it('abaixo do drawerFrom volta a gaveta com o botão de menu', () => {
    windowWidth = 700;
    shell({ platform: 'mac' });
    expect(pinned()).toBe(false);
    windowWidth = 1000;
    cleanup();
    shell({ platform: 'windows', drawerFrom: 1100 });
    expect(pinned()).toBe(false);
  });

  it('sem desktop, o site continua trocando no lg (1200 px)', () => {
    windowWidth = 900;
    shell();
    expect(pinned()).toBe(false);
    cleanup();
    windowWidth = 1200;
    shell();
    expect(pinned()).toBe(true);
  });
});
