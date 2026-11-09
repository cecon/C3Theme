// @vitest-environment jsdom
import { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider, DEFAULT_UI_CONFIG } from '../config';
import { NavContext, NavGroup } from './nav';
import RailDrawer from './RailDrawer';
import VerticalNav from './VerticalNav';

afterEach(cleanup);

const menu: NavGroup[] = [
  { id: 'g0', items: [{ id: 'ini', title: 'Início', url: '/' }] },
  {
    id: 'g1',
    items: [
      {
        id: 'cad',
        title: 'Cadastros',
        children: [
          { id: 'cli', title: 'Clientes', url: '/clientes' },
          {
            id: 'prod',
            title: 'Produtos',
            children: [
              { id: 'pl', title: 'Lista de produtos', url: '/produtos' },
              { id: 'pa', title: 'Ajustar preço', url: '/produtos/preco' }
            ]
          }
        ]
      },
      {
        id: 'fin',
        title: 'Financeiro',
        children: [
          { id: 'rec', title: 'Contas a receber', url: '/receber' },
          { id: 'pag', title: 'Contas a pagar', url: '/pagar' }
        ]
      }
    ]
  }
];

const wrap = (ui: ReactNode, path = '/') =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <ConfigProvider storageKey="teste" defaults={DEFAULT_UI_CONFIG}>
          <MemoryRouter initialEntries={[path]}>
            <NavContext.Provider value={menu}>{ui}</NavContext.Provider>
          </MemoryRouter>
        </ConfigProvider>
      </IntlProvider>
    </ThemeProvider>
  );

describe('menu lateral em acordeão', () => {
  it('começa com o caminho da tela atual aberto e abrir outro grupo fecha o anterior', () => {
    wrap(<VerticalNav />, '/clientes');
    const cad = screen.getByRole('button', { name: 'Cadastros' });
    const fin = screen.getByRole('button', { name: 'Financeiro' });
    expect(cad.getAttribute('aria-expanded')).toBe('true');
    expect(fin.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(fin);
    expect(fin.getAttribute('aria-expanded')).toBe('true');
    expect(cad.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('menu em dois níveis', () => {
  const props = { mini: false, mobileOpen: false, onMobileClose: vi.fn(), headerHeight: 64 };

  it('painel fixo mostra o módulo da tela atual, com filho de filho como título de seção', () => {
    wrap(<RailDrawer desktop {...props} />, '/produtos');
    const panel = screen.getByRole('navigation', { name: 'Cadastros' });
    expect(panel.querySelector('section')?.textContent).toContain('Produtos');
    expect(screen.getByRole('link', { name: 'Lista de produtos' }).getAttribute('aria-current')).toBe('page');
  });

  it('clicar em outro módulo troca o painel; clicar de novo fecha', () => {
    wrap(<RailDrawer desktop {...props} />, '/');
    expect(screen.queryByRole('navigation', { name: 'Cadastros' })).toBeNull();
    const fin = screen.getByRole('button', { name: 'Financeiro' });
    fireEvent.click(fin);
    expect(screen.getByRole('navigation', { name: 'Financeiro' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastros' }));
    expect(screen.queryByRole('navigation', { name: 'Financeiro' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastros' }));
    expect(screen.queryByRole('navigation', { name: 'Cadastros' })).toBeNull();
  });

  it('recolhido, o painel abre flutuando e fecha ao escolher a tela', () => {
    wrap(<RailDrawer desktop {...props} mini />, '/');
    fireEvent.click(screen.getByRole('button', { name: 'Financeiro' }));
    fireEvent.click(screen.getByRole('link', { name: 'Contas a pagar' }));
    expect(screen.queryByRole('navigation', { name: 'Financeiro' })).toBeNull();
  });
});
