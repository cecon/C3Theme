// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import useMessageQueue from './useMessageQueue';

function setup(generating = true, conversationId = 'c1') {
  const send = vi.fn();
  const hook = renderHook((p: { generating: boolean; conversationId: string }) => useMessageQueue({ ...p, send }), {
    initialProps: { generating, conversationId }
  });
  return { send, ...hook };
}

describe('useMessageQueue', () => {
  it('sai uma por vez quando a resposta termina', () => {
    const { result, rerender, send } = setup();
    act(() => {
      result.current.enqueue('primeira');
      result.current.enqueue('segunda');
    });
    expect(result.current.items.map((q) => q.text)).toEqual(['primeira', 'segunda']);
    rerender({ generating: false, conversationId: 'c1' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('primeira', []);
    expect(result.current.items.map((q) => q.text)).toEqual(['segunda']);
    rerender({ generating: true, conversationId: 'c1' });
    rerender({ generating: false, conversationId: 'c1' });
    expect(send).toHaveBeenLastCalledWith('segunda', []);
    expect(result.current.items).toEqual([]);
  });

  it('depois de pausar (Parar), não sai sozinha; enviar agora manda', () => {
    const { result, rerender, send } = setup();
    act(() => result.current.enqueue('depois'));
    act(() => result.current.pause());
    rerender({ generating: false, conversationId: 'c1' });
    expect(send).not.toHaveBeenCalled();
    act(() => result.current.sendNow(result.current.items[0].id));
    expect(send).toHaveBeenCalledWith('depois', []);
    expect(result.current.items).toEqual([]);
  });

  it('edita, tira, ignora vazio e esvazia ao trocar de conversa', () => {
    const { result, rerender } = setup();
    act(() => {
      result.current.enqueue('   ');
      result.current.enqueue('a');
      result.current.enqueue('b');
    });
    const [a, b] = result.current.items;
    act(() => {
      result.current.update(a.id, 'a editada');
      result.current.remove(b.id);
    });
    expect(result.current.items.map((q) => q.text)).toEqual(['a editada']);
    rerender({ generating: true, conversationId: 'c2' });
    expect(result.current.items).toEqual([]);
  });

  it('orientar tira da fila e manda pelo steer; com a caixa vazia orienta a primeira', () => {
    const send = vi.fn();
    const steer = vi.fn();
    const { result } = renderHook(() => useMessageQueue({ generating: true, send, steer }));
    expect(result.current.canSteer).toBe(true);
    act(() => {
      result.current.enqueue('primeira');
      result.current.enqueue('segunda');
    });
    let took = false;
    act(() => {
      took = result.current.steer(result.current.items[1].id);
    });
    expect(took).toBe(true);
    expect(steer).toHaveBeenCalledWith('segunda', []);
    act(() => {
      took = result.current.steerNext();
    });
    expect(took).toBe(true);
    expect(steer).toHaveBeenLastCalledWith('primeira', []);
    expect(result.current.items).toEqual([]);
    act(() => {
      took = result.current.steerNext();
    });
    expect(took).toBe(false);
    expect(result.current.steer('nada')).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('sem steer, orientar não tira nada da fila', () => {
    const { result } = renderHook(() => useMessageQueue({ generating: true, send: vi.fn() }));
    expect(result.current.canSteer).toBe(false);
    act(() => result.current.enqueue('fica'));
    act(() => {
      result.current.steerNext();
    });
    expect(result.current.items.map((q) => q.text)).toEqual(['fica']);
  });
});
