// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it } from 'vitest';
import C3ThemeProvider from '../C3ThemeProvider';
import AppLayout, { type AppLayoutProps } from './AppLayout';
import type { UiConfig } from '../config';

let width = 1400;
beforeEach(() => {
  localStorage.clear();
  width = 1400;
  window.scrollTo = () => {};
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    return {
      matches: (!min || width >= Number(min[1])) && (!max || width <= Number(max[1])),
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
const menu = [
  {
    id: 'main',
    items: [
      { id: 'home', title: 'Início', url: '/' },
      { id: 'module', title: 'Módulo', children: [{ id: 'child', title: 'Página antiga', url: '/child' }] }
    ]
  }
];
function mount(props: Partial<AppLayoutProps> = {}, config: Partial<UiConfig> = {}) {
  return render(
    <C3ThemeProvider defaultConfig={config}>
      <MemoryRouter>
        <AppLayout menu={menu} breadcrumbs={false} documentTitle={false} {...props}>
          Conteúdo central
        </AppLayout>
      </MemoryRouter>
    </C3ThemeProvider>
  );
}
const sidebar = <nav aria-label="Lista lateral">Lista customizada</nav>;

it('lista customizada preserva o trilho e não é trocada ao clicar em módulo', () => {
  mount({ sidebar }, { menuOrientation: 'rail' });
  expect(screen.getByRole('link', { name: 'Início' })).toBeTruthy();
  expect(screen.getByRole('navigation', { name: 'Lista lateral' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Módulo' }));
  expect(screen.getByRole('navigation', { name: 'Lista lateral' })).toBeTruthy();
  expect(screen.queryByText('Página antiga')).toBeNull();
});
it('recolher ou ocultar a lista libera o painel mas mantém o trilho, sem painel flutuante', () => {
  mount({ sidebar }, { menuOrientation: 'rail' });
  fireEvent.click(screen.getByRole('button', { name: /menu/i }));
  expect(screen.queryByRole('navigation', { name: 'Lista lateral' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Início' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Módulo' }));
  expect(screen.queryByText('Página antiga')).toBeNull();
  cleanup();
  mount({ sidebar, navigationHidden: true }, { menuOrientation: 'rail' });
  expect(screen.queryByRole('navigation', { name: 'Lista lateral' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Início' })).toBeTruthy();
});
it.each([false, true])('conta continua acessível com lista substituída ou oculta: %s', (hidden) => {
  mount({ sidebar, navigationHidden: hidden, user: { name: 'Pessoa' }, userPlacement: 'drawer' });
  expect(screen.getByRole('button', { name: /conta/i })).toBeTruthy();
});
it('selecionar linha via render prop fecha a gaveta móvel', async () => {
  width = 500;
  mount({ sidebar: (onNavigate) => <button onClick={onNavigate}>Escolher item</button> });
  fireEvent.click(screen.getByRole('button', { name: /menu/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Escolher item' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Escolher item' })).toBeNull());
});
