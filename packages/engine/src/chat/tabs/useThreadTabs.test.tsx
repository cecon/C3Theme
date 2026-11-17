// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WireLane } from '../../agent/lanes';
import { MAIN_TAB } from './tabsDef';
import useThreadTabs from './useThreadTabs';

const notify = vi.hoisted(() => vi.fn());
vi.mock('@c3theme/ui', async (original) => ({ ...(await original<typeof import('@c3theme/ui')>()), notify }));

const lane = (id: string, extra: Partial<WireLane> = {}): WireLane => ({
  id,
  title: id.toUpperCase(),
  kind: 'aside',
  parentId: 'p',
  unread: 0,
  updatedAt: '2026-11-17T00:00:00Z',
  ...extra
});
const KEY = 'c3.chat.tabs/t/p';
const lanes = [lane('a'), lane('b'), lane('c', { unavailable: 'fora' })];
const mount = (opened?: string) =>
  renderHook(
    (p: { opened?: string }) =>
      useThreadTabs({
        prefsKey: KEY,
        mainLabel: 'Principal',
        draftLabel: 'Nova',
        lanes,
        settled: true,
        opened: p.opened,
        onOpened: () => {}
      }),
    {
      initialProps: { opened }
    }
  );
const undo = () => notify.mock.calls.at(-1)![2].onClick();
afterEach(() => {
  localStorage.clear();
  notify.mockClear();
});

describe('useThreadTabs (#134)', () => {
  it('thread aberta vira aba ativa; fechar a ativa vai para a vizinha e desfazer devolve', () => {
    const { result, rerender } = mount();
    expect(result.current.ids).toEqual([MAIN_TAB]);
    rerender({ opened: 'a' });
    rerender({ opened: 'b' });
    expect(result.current.ids).toEqual([MAIN_TAB, 'a', 'b']);
    expect(result.current.current).toBe('b');
    act(() => result.current.close('b'));
    expect(result.current.current).toBe('a');
    expect(notify).toHaveBeenCalledWith('Aba fechada.', 'info', expect.objectContaining({ label: 'Desfazer' }));
    act(undo);
    expect(result.current.ids).toEqual([MAIN_TAB, 'a', 'b']);
    expect(result.current.closed.map((t) => t.id)).toEqual(['c']);
  });

  it('fechar as outras deixa a principal e a escolhida, com desfazer; reabrir põe no fim', () => {
    const { result, rerender } = mount();
    rerender({ opened: 'a' });
    rerender({ opened: 'b' });
    act(() => result.current.addDraft());
    act(() => result.current.closeOthers('a'));
    expect(result.current.ids).toEqual([MAIN_TAB, 'a']);
    expect(result.current.current).toBe('a');
    act(undo);
    expect(result.current.ids).toEqual([MAIN_TAB, 'a', 'b']);
    act(() => result.current.close('a'));
    act(() => result.current.reopen('a'));
    expect(result.current.ids).toEqual([MAIN_TAB, 'b', 'a']);
    expect(result.current.current).toBe('a');
  });

  it('reordenar guarda as laterais e mantém os rascunhos na memória; renomear dá nome à aba', () => {
    const { result, rerender } = mount();
    rerender({ opened: 'a' });
    rerender({ opened: 'b' });
    act(() => result.current.addDraft());
    const draft = result.current.ids[3];
    act(() => result.current.reorder([MAIN_TAB, draft, 'b', 'a']));
    expect(JSON.parse(localStorage.getItem(KEY)!).open).toEqual(['b', 'a']);
    expect(result.current.ids).toEqual([MAIN_TAB, 'b', 'a', draft]);
    act(() => result.current.rename('b', 'Bê'));
    expect(result.current.tabs.find((t) => t.id === 'b')!.label).toBe('Bê');
    expect(result.current.tabs.find((t) => t.id === draft)!.label).toBe('Nova');
    act(() => result.current.close(draft));
    expect(result.current.ids).toEqual([MAIN_TAB, 'b', 'a']);
    expect(notify).not.toHaveBeenCalled();
  });

  it('próxima/anterior dão a volta e pulam a indisponível; rascunho descartado some', () => {
    localStorage.setItem(KEY, JSON.stringify({ open: ['a', 'c'], names: {} }));
    const { result } = mount();
    act(() => result.current.step(1));
    expect(result.current.current).toBe('a');
    act(() => result.current.step(1));
    expect(result.current.current).toBe(MAIN_TAB);
    act(() => result.current.step(-1));
    expect(result.current.current).toBe('a');
    act(() => result.current.addDraft());
    const draft = result.current.current;
    act(() => result.current.dropDraft(draft));
    expect(result.current.current).toBe(MAIN_TAB);
    expect(result.current.tabs.find((t) => t.id === 'c')!.disabled).toBe('fora');
  });

  it('ativa que deixa de existir volta para a principal; thread aberta duas vezes não duplica', () => {
    const { result, rerender } = mount();
    rerender({ opened: 'a' });
    rerender({ opened: undefined });
    rerender({ opened: 'a' });
    expect(JSON.parse(localStorage.getItem(KEY)!).open).toEqual(['a']);
    act(() => void localStorage.setItem(KEY, JSON.stringify({ open: [], names: {} })));
    act(() => void window.dispatchEvent(new StorageEvent('storage', { key: KEY })));
    expect(result.current.current).toBe(MAIN_TAB);
  });
});
