// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import ServerRail from '../ServerRail';
import type { ServerRailItem } from './types';
import PageRail from '../PageRail';

afterEach(() => {
  cleanup();
  globalThis.localStorage.clear();
});

const SERVIDORES: ServerRailItem[] = [
  { id: 'local', name: 'Este computador', state: 'online', badge: 'Este computador' },
  { id: 's1', name: 'Matriz', state: 'incompatible', detail: 'Atualize o Piecework' },
  { id: 's2', name: 'Filial', state: 'offline' }
];

function montarRail(mudanca: Partial<React.ComponentProps<typeof ServerRail>> = {}) {
  return render(
    <MemoryRouter>
      <ServerRail
        servers={SERVIDORES}
        activeId="local"
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRetry={vi.fn()}
        storageKey="teste-rail"
        {...mudanca}
      />
    </MemoryRouter>
  );
}

describe('rail de servidores (#116)', () => {
  it('desenha os servidores como navegação com nome e estado acessíveis', () => {
    montarRail();
    const navegacao = screen.getByRole('navigation', { name: 'Servidores' });
    expect(within(navegacao).getByRole('button', { name: 'Este computador (online)' })).toBeTruthy();
    expect(within(navegacao).getByRole('button', { name: 'Matriz (incompatível)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Este computador (online)' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'Filial (offline)' }).getAttribute('aria-current')).toBeNull();
  });

  it('troca de servidor por clique e não repete a troca do ativo', () => {
    const onSelect = vi.fn();
    montarRail({ onSelect });
    fireEvent.click(screen.getByRole('button', { name: 'Matriz (incompatível)' }));
    expect(onSelect).toHaveBeenCalledWith('s1');
    fireEvent.click(screen.getByRole('button', { name: 'Este computador (online)' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('seleciona pelo atalho de 1 a 9 na ordem exibida e ignora campo de texto', () => {
    const onSelect = vi.fn();
    montarRail({ onSelect });
    fireEvent.keyDown(window, { key: '2', ctrlKey: true });
    expect(onSelect).toHaveBeenCalledWith('s1');
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, { key: '3', ctrlKey: true });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('loading reserva espaço com esqueleto', () => {
    montarRail({ state: 'loading' });
    expect(screen.getByLabelText('Carregando servidores')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Este computador/ })).toBeNull();
  });

  it('erro mostra a mensagem e tenta de novo', () => {
    const onRetry = vi.fn();
    montarRail({ state: 'error', errorMessage: 'Falhou ao carregar', onRetry });
    expect(screen.getByRole('alert').textContent).toContain('Falhou ao carregar');
    fireEvent.click(screen.getByText('Tentar de novo'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('vazio mostra o convite para adicionar', () => {
    const onAdd = vi.fn();
    montarRail({ servers: [], onAdd });
    expect(screen.getByText('Nenhum servidor')).toBeTruthy();
    fireEvent.click(screen.getByText('Adicionar servidor'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('menu de ações abre pelo teclado e move o servidor na ordem', () => {
    const onReorder = vi.fn();
    const onAnnounce = vi.fn();
    montarRail({ onReorder, onAnnounce, actions: () => [{ id: 'config', label: 'Configurações' }] });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Matriz (incompatível)' }), { key: 'F10', shiftKey: true });
    fireEvent.click(screen.getByText('Mover para cima'));
    expect(onReorder).toHaveBeenCalledWith(['s1', 'local', 's2']);
    expect(onAnnounce).toHaveBeenCalledWith(expect.stringContaining('posição 1'));
  });

  it('ordem guardada é respeitada ao abrir', () => {
    globalThis.localStorage.setItem(
      'teste-ordem',
      JSON.stringify({ serverOrder: ['s2', 'local'], localHidden: false, pinnedPages: null, pagesCollapsed: false })
    );
    montarRail({ storageKey: 'teste-ordem' });
    const botoes = screen
      .getAllByRole('button')
      .filter((b) => /\((online|offline|incompatível)\)/.test(b.getAttribute('aria-label') ?? ''));
    expect(botoes.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Filial (offline)',
      'Este computador (online)',
      'Matriz (incompatível)'
    ]);
  });
});

function montarPaginas(mudanca: Partial<React.ComponentProps<typeof PageRail>> = {}) {
  return render(
    <MemoryRouter>
      <PageRail
        pages={[
          { id: 'agentes', title: 'Agentes', url: '/agentes', fixed: true },
          { id: 'uso', title: 'Uso', url: '/uso' },
          { id: 'config', title: 'Configurações', url: '/config' }
        ]}
        activePath="/uso"
        defaultPinned={['agentes']}
        brand={{ label: 'Piecework' }}
        help={{ version: '1.2.3', links: [{ label: 'Guia', href: 'https://exemplo.com/guia' }] }}
        storageKey="teste-paginas"
        {...mudanca}
      />
    </MemoryRouter>
  );
}

describe('rail de páginas (#117)', () => {
  it('marca a página atual e deixa no rail as fixadas', () => {
    montarPaginas();
    expect(screen.getByRole('link', { name: 'Agentes' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Uso' })).toBeNull();
  });

  it('o menu de mais lista as páginas e fixa sem fechar o menu', () => {
    montarPaginas();
    fireEvent.click(screen.getByRole('button', { name: /Mais páginas/ }));
    expect(screen.getByText('Configurações')).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Fixar Uso no rail' }));
    // o menu continua aberto depois de fixar
    expect(screen.getByText('Configurações')).toBeTruthy();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.getByRole('link', { name: 'Uso' })).toBeTruthy();
  });

  it('recolhido continua navegável e guarda a preferência', () => {
    montarPaginas();
    fireEvent.click(screen.getByRole('button', { name: 'Recolher o rail' }));
    expect(screen.getByRole('link', { name: 'Agentes' })).toBeTruthy();
    const guardado = JSON.parse(globalThis.localStorage.getItem('teste-paginas') ?? '{}') as { pagesCollapsed?: boolean };
    expect(guardado.pagesCollapsed).toBe(true);
    expect(screen.getByRole('button', { name: 'Expandir o rail' })).toBeTruthy();
  });

  it('a ajuda mostra a versão e os links; sem notas, mostra só os links', () => {
    montarPaginas();
    fireEvent.click(screen.getByRole('button', { name: /Ajuda e versão/ }));
    expect(screen.getByText('Versão 1.2.3')).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Guia' })).toBeTruthy();
  });

  it('rail oculto não reserva espaço', () => {
    const { container } = montarPaginas({ hidden: true });
    expect(container.querySelector('nav')).toBeNull();
  });
});
