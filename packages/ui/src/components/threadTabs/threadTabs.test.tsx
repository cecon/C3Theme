// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import C3ThemeProvider from '../../C3ThemeProvider';
import ThreadTabs from './ThreadTabs';
import type { ThreadTabsProps } from './types';

const tabs: ThreadTabsProps['tabs'] = [
  { id: 'main', label: 'Principal', closable: false },
  { id: 'a', label: 'Pesquisa', state: 'running' },
  { id: 'b', label: 'Revisão', state: 'waiting' },
  { id: 'c', label: 'Antiga', disabled: 'arquivada em outro aparelho' }
];
const show = (props: Partial<ThreadTabsProps> = {}) => {
  const handlers = {
    onSelect: vi.fn(),
    onNew: vi.fn(),
    onClose: vi.fn(),
    onCloseOthers: vi.fn(),
    onRename: vi.fn(),
    onReorder: vi.fn(),
    onReopen: vi.fn()
  };
  render(
    <C3ThemeProvider>
      <ThreadTabs label="Threads" tabs={tabs} active="main" {...handlers} {...props} />
    </C3ThemeProvider>
  );
  return handlers;
};
const tab = (name: RegExp | string) => screen.getByRole('tab', { name });
const frame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
afterEach(cleanup);

describe('ThreadTabs (#134)', () => {
  it('uma aba por thread: ativa marcada, estado e indisponível no nome acessível, só a ativa no Tab', () => {
    show({ active: 'a' });
    expect(screen.getByRole('tablist', { name: 'Threads' })).toBeTruthy();
    expect(tab('Pesquisa, executando').getAttribute('aria-selected')).toBe('true');
    expect(tab('Principal').getAttribute('aria-selected')).toBe('false');
    expect(tab('Revisão, aguardando você')).toBeTruthy();
    expect(tab('Antiga, indisponível: arquivada em outro aparelho').getAttribute('aria-disabled')).toBe('true');
    expect(tab(/Pesquisa/).tabIndex).toBe(0);
    expect(tab('Principal').tabIndex).toBe(-1);
  });

  it('setas, Home e End trocam de aba pulando a indisponível; clique na indisponível não troca', async () => {
    const h = show();
    fireEvent.keyDown(tab('Principal'), { key: 'ArrowRight' });
    expect(h.onSelect).toHaveBeenLastCalledWith('a');
    fireEvent.keyDown(tab('Principal'), { key: 'ArrowLeft' });
    expect(h.onSelect).toHaveBeenLastCalledWith('b');
    fireEvent.keyDown(tab('Principal'), { key: 'End' });
    expect(h.onSelect).toHaveBeenLastCalledWith('b');
    fireEvent.keyDown(tab(/Revisão/), { key: 'Home' });
    expect(h.onSelect).toHaveBeenLastCalledWith('main');
    await frame();
    h.onSelect.mockClear();
    fireEvent.click(tab(/Antiga/));
    expect(h.onSelect).not.toHaveBeenCalled();
    fireEvent.click(tab(/Pesquisa/));
    expect(h.onSelect).toHaveBeenCalledWith('a');
  });

  it('Delete fecha a que pode; a principal não fecha; × e clique do meio também fecham', () => {
    const h = show();
    fireEvent.keyDown(tab('Principal'), { key: 'Delete' });
    expect(h.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(tab(/Pesquisa/), { key: 'Delete' });
    expect(h.onClose).toHaveBeenCalledWith('a');
    fireEvent.click(tab(/Revisão/).querySelector('[data-close]')!);
    expect(h.onClose).toHaveBeenLastCalledWith('b');
    expect(h.onSelect).not.toHaveBeenCalled();
    fireEvent(tab(/Pesquisa/), new MouseEvent('auxclick', { bubbles: true, button: 1 }));
    expect(h.onClose).toHaveBeenCalledTimes(3);
    expect(tab('Principal').querySelector('[data-close]')).toBeNull();
  });

  it('menu pela tecla move, fecha as outras e anuncia a posição; a principal não sai da ponta', async () => {
    const h = show();
    fireEvent.keyDown(tab(/Revisão/), { key: 'F10', shiftKey: true });
    const menu = await screen.findByRole('menu');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Mover para a esquerda' }));
    expect(h.onReorder).toHaveBeenCalledWith(['main', 'b', 'a', 'c']);
    expect(screen.getByText('Revisão na posição 2 de 4')).toBeTruthy();
    fireEvent.keyDown(tab(/Pesquisa/), { key: 'ContextMenu' });
    const second = await screen.findByRole('menu');
    expect(within(second).getByRole('menuitem', { name: 'Mover para a esquerda' }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(within(second).getByRole('menuitem', { name: 'Fechar as outras' }));
    expect(h.onCloseOthers).toHaveBeenCalledWith('a');
    fireEvent.contextMenu(tab('Principal'));
    const third = await screen.findByRole('menu');
    expect(within(third).queryByRole('menuitem', { name: 'Fechar' })).toBeNull();
    expect(within(third).getByRole('menuitem', { name: 'Mover para a direita' }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(within(third).getByRole('menuitem', { name: 'Fechar as outras' }));
  });

  it('F2 e o menu renomeiam; cancelar devolve o foco à aba', async () => {
    const h = show();
    fireEvent.keyDown(tab(/Pesquisa/), { key: 'F2' });
    const name = await screen.findByRole('textbox', { name: 'Nome' });
    fireEvent.change(name, { target: { value: 'Pesquisa de preço' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(h.onRename).toHaveBeenCalledWith('a', 'Pesquisa de preço');
    fireEvent.contextMenu(tab(/Revisão/));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await frame();
    expect(document.activeElement).toBe(tab(/Revisão/));
  });

  it('arrastar solta antes da aba de destino, nunca antes da principal', () => {
    const h = show();
    const data = new Map<string, string>();
    const dataTransfer = {
      types: ['application/x-c3-thread-tab'],
      setData: (k: string, v: string) => data.set(k, v),
      getData: (k: string) => data.get(k) ?? '',
      effectAllowed: ''
    };
    fireEvent.dragStart(tab(/Revisão/), { dataTransfer });
    fireEvent.dragOver(tab(/Pesquisa/), { dataTransfer });
    fireEvent.drop(tab(/Pesquisa/), { dataTransfer });
    expect(h.onReorder).toHaveBeenLastCalledWith(['main', 'b', 'a', 'c']);
    fireEvent.drop(tab('Principal'), { dataTransfer });
    expect(h.onReorder).toHaveBeenLastCalledWith(['main', 'b', 'a', 'c']);
    expect(tab('Principal').getAttribute('draggable')).toBe('false');
    h.onReorder.mockClear();
    fireEvent.drop(tab(/Revisão/), { dataTransfer });
    fireEvent.drop(tab(/Pesquisa/), { dataTransfer: { ...dataTransfer, getData: () => '' } });
    expect(h.onReorder).not.toHaveBeenCalled();
  });

  it('"+" abre thread nova; fechadas aparecem para reabrir na lista', async () => {
    const h = show({ closed: [{ id: 'z', label: 'Rascunho de ontem' }] });
    fireEvent.click(screen.getByRole('button', { name: 'Nova thread' }));
    expect(h.onNew).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Todas as abas' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Reabrir')).toBeTruthy();
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Rascunho de ontem' }));
    expect(h.onReopen).toHaveBeenCalledWith('z');
    fireEvent.click(screen.getByRole('button', { name: 'Todas as abas' }));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Revisão' }));
    expect(h.onSelect).toHaveBeenLastCalledWith('b');
  });

  it('sem fechadas nem sobra, não há botão de lista nem "+" sem onNew', () => {
    show({ onNew: undefined });
    expect(screen.queryByRole('button', { name: 'Todas as abas' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nova thread' })).toBeNull();
  });

  it('carregando reserva a altura; erro mostra a mensagem e tenta de novo', () => {
    const onRetry = vi.fn();
    show({ loading: true });
    expect(screen.getByRole('status', { name: 'Carregando threads' })).toBeTruthy();
    cleanup();
    show({ error: 'Não deu para abrir as threads.', onRetry });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('sem aba ativa na lista, a primeira entra no Tab', () => {
    show({ active: 'sumiu' });
    expect(tab('Principal').tabIndex).toBe(0);
  });
});
