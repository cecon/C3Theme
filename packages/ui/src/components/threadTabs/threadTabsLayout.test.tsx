// @vitest-environment jsdom
import { cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import C3ThemeProvider from '../../C3ThemeProvider';
import ThreadTabs from './ThreadTabs';
import type { ThreadTabsProps } from './types';

const tabs: ThreadTabsProps['tabs'] = [
  { id: 'main', label: 'Principal', closable: false },
  { id: 'a', label: 'Pesquisa' }
];
const show = (props: Partial<ThreadTabsProps> = {}) =>
  render(
    <C3ThemeProvider>
      <ThreadTabs label="Threads" tabs={tabs} active="a" onSelect={vi.fn()} {...props} />
    </C3ThemeProvider>
  );
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ThreadTabs: celular e sobra (#134)', () => {
  it('no celular vira o botão de lista com a aba ativa', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {}
    }));
    const onSelect = vi.fn();
    show({ onSelect });
    expect(screen.queryByRole('tablist')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Todas as abas: Pesquisa' }));
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('menuitem', { name: 'Principal' }));
    expect(onSelect).toHaveBeenCalledWith('main');
  });

  it('com abas além da largura, aparece a lista e a sombra; rolar até o fim tira a sombra da direita', () => {
    const box = { scrollWidth: 900, clientWidth: 300, scrollLeft: 0 };
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => box.scrollWidth);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => box.clientWidth);
    vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockImplementation(() => box.scrollLeft);
    show();
    expect(screen.getByRole('button', { name: 'Todas as abas' })).toBeTruthy();
    box.scrollLeft = 600;
    fireEvent.scroll(screen.getByRole('tablist'));
    expect(screen.getByRole('button', { name: 'Todas as abas' })).toBeTruthy();
  });

  it('arrastar perto da borda rola a faixa; arrasto de outra coisa não rola', () => {
    show();
    const list = screen.getByRole('tablist');
    list.getBoundingClientRect = () => ({
      left: 0,
      right: 300,
      top: 0,
      bottom: 40,
      width: 300,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });
    let left = 100;
    Object.defineProperty(list, 'scrollLeft', { get: () => left, set: (v: number) => (left = v), configurable: true });
    // o jsdom não tem DragEvent: o clientX vai à mão
    const drag = (types: string[], clientX: number) => {
      const event = createEvent.dragOver(list, { dataTransfer: { types } });
      Object.defineProperty(event, 'clientX', { value: clientX });
      fireEvent(list, event);
    };
    drag(['application/x-c3-thread-tab'], 290);
    expect(left).toBe(116);
    drag(['application/x-c3-thread-tab'], 10);
    expect(left).toBe(100);
    drag(['application/x-c3-thread-tab'], 150);
    expect(left).toBe(100);
    drag(['text/plain'], 290);
    expect(left).toBe(100);
  });
});
