// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import C3ThemeProvider from '../../C3ThemeProvider';
import SectionSidebar from '../SectionSidebar';
import type { SectionSidebarProps } from './types';
import { readPreferences } from './preferences';

const data: SectionSidebarProps = {
  storageKey: 'servidor-A',
  label: 'Conversas',
  title: 'Agentes',
  sections: [
    { id: 'team', label: 'Time' },
    { id: 'other', label: 'Outros' }
  ],
  items: [
    { id: 'ana', label: 'Ana', section: 'team', status: 'Trabalhando', pending: 2 },
    { id: 'bia', label: 'Bia', section: 'team' }
  ],
  onSelect: vi.fn()
};
const show = (props: Partial<SectionSidebarProps> = {}) =>
  render(
    <C3ThemeProvider>
      <SectionSidebar {...data} {...props} />
    </C3ThemeProvider>
  );
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);
const actions = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }));
  return screen.findByRole('menu');
};
describe('lista lateral por servidor', () => {
  it('recolhe com contador pendente visível, persiste e isola o servidor', () => {
    const first = show();
    fireEvent.click(screen.getByRole('button', { name: /Time \(2\)/ }));
    expect(screen.getByRole('button', { name: /Time \(2\).*2 pendentes/ }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /Ana Trabalhando/ })).toBeNull();
    first.unmount();
    const second = show();
    expect(screen.getByRole('button', { name: /Time \(2\)/ }).getAttribute('aria-expanded')).toBe('false');
    second.unmount();
    show({ storageKey: 'servidor-B' });
    expect(screen.getByRole('button', { name: /Time \(2\)/ }).getAttribute('aria-expanded')).toBe('true');
  });
  it('fixa no topo e desafixa sem duplicar a linha', async () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Fixar Bia' }));
    expect(screen.getByText('Fixados')).toBeTruthy();
    expect(screen.getAllByRole('group', { name: 'Bia' })).toHaveLength(1);
    expect(readPreferences('servidor-A').pinned).toEqual(['bia']);
    fireEvent.click(screen.getByRole('button', { name: 'Desafixar Bia' }));
    expect(screen.queryByText('Fixados')).toBeNull();
  });
  it('cria e renomeia seção; move item pelo menu e devolve após excluir', async () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Criar seção' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Favoritos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    let menu = await actions('Ações de Bia');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Mover para Favoritos' }));
    expect(screen.getByRole('button', { name: /Favoritos \(1\)/ })).toBeTruthy();
    menu = await actions('Ações da seção Favoritos');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Renomear seção' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Leituras' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    menu = await actions('Ações da seção Leituras');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Excluir seção' }));
    expect(screen.queryByRole('button', { name: /Leituras \(/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Time \(2\)/ })).toBeTruthy();
  });
  it('menu de teclado devolve foco e reordena com anúncio persistente', async () => {
    show();
    const row = screen.getByRole('button', { name: 'Bia' });
    row.focus();
    fireEvent.keyDown(row, { key: 'F10', shiftKey: true });
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Mover para cima' }));
    await waitFor(() => expect(document.activeElement).toBe(row));
    expect(screen.getByRole('status').textContent).toContain('Bia: posição 1');
    expect(readPreferences('servidor-A').order.slice(0, 2)).toEqual(['bia', 'ana']);
  });
  it('arrastar entre seções persiste o destino e não dispara seleção', () => {
    const onSelect = vi.fn();
    show({ onSelect });
    const transfer = { getData: () => 'ana', types: ['application/x-c3-sidebar-item'] };
    const target = screen.getByRole('button', { name: /Outros \(0\)/ }).parentElement!.parentElement!;
    fireEvent.drop(target, { dataTransfer: transfer });
    expect(readPreferences('servidor-A').moved.ana).toBe('other');
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('apresenta apenas um alerta, prioriza crítico e dispensa', () => {
    show({
      cards: [
        { id: 'warning', label: 'Atualização', severity: 'warning', action: { id: 'update', label: 'Atualizar' } },
        { id: 'critical', label: 'Armazenamento', severity: 'critical', dismissible: true, action: { id: 'free', label: 'Liberar espaço' } }
      ]
    });
    expect(screen.queryByText('Atualização')).toBeNull();
    expect(screen.getByText('Armazenamento')).toBeTruthy();
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: /close|fechar/i }));
    expect(screen.getByText('Atualização')).toBeTruthy();
  });
  it('falha de ação não gera rejeição sem tratamento', async () => {
    show({
      onAction: async () => {
        throw Error('segredo do backend');
      },
      items: [{ ...data.items[0], actions: [{ id: 'duplicate', label: 'Duplicar' }] }]
    });
    const menu = await actions('Ações de Ana');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Duplicar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível concluir');
    expect(screen.queryByText('segredo do backend')).toBeNull();
  });
  it('carregando, erro com retry e vazio sem dados', () => {
    const onRetry = vi.fn();
    const initial = show({ loading: true });
    expect(screen.getByLabelText('Carregando lista')).toBeTruthy();
    initial.unmount();
    const failed = show({ error: 'Servidor não respondeu', onRetry });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledOnce();
    failed.unmount();
    show({ items: [], sections: [], empty: 'Nada por aqui' });
    expect(screen.getByText('Nada por aqui')).toBeTruthy();
  });
  it('linhas órfãs continuam visíveis mesmo sem seções declaradas', () => {
    show({ sections: [] });
    expect(screen.getByRole('button', { name: /Itens \(2\)/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bia' })).toBeTruthy();
  });
  it('oculta e reexibe uma linha sem perder o registro da fonte', async () => {
    show();
    const menu = await actions('Ações de Bia');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Ocultar' }));
    expect(screen.queryByRole('button', { name: 'Bia' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar ocultos' }));
    expect(screen.getByRole('button', { name: 'Bia' })).toBeTruthy();
  });
  it('auto-drop não muda ordem e drag sobre cabeçalho recolhido move o item', () => {
    show();
    const transfer = { getData: () => 'ana', types: ['application/x-c3-sidebar-item'] };
    fireEvent.drop(screen.getByRole('group', { name: 'Ana' }), { dataTransfer: transfer });
    expect(readPreferences('servidor-A').order).toEqual([]);
    const header = screen.getByRole('button', { name: /Outros \(0\)/ });
    fireEvent.click(header);
    fireEvent.drop(header, { dataTransfer: transfer });
    expect(readPreferences('servidor-A').moved.ana).toBe('other');
  });
});
