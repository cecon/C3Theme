// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { memoryTransport } from '../adapters/memoryTransport';
import useTypingStatus from './useTypingStatus';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const ana = { id: 'ana', name: 'Ana' };

describe('useTypingStatus', () => {
  it('mostra quem digita, ignora eu mesmo e some depois do tempo', () => {
    const { transport, emit } = memoryTransport();
    const { result } = renderHook(() => useTypingStatus(transport, 'c1', { id: 'me' }));
    act(() => emit('c1', { type: 'typing', conversationId: 'c1', author: ana, typing: true }));
    act(() => emit('c1', { type: 'typing', conversationId: 'c1', author: { id: 'me', name: 'Eu' }, typing: true }));
    expect(result.current.typing).toEqual([ana]);
    act(() => vi.advanceTimersByTime(6100));
    expect(result.current.typing).toEqual([]);
  });

  it('envia no máximo um aviso a cada 3 s e "parei" depois de 5 s parado', () => {
    const { transport } = memoryTransport();
    const sent: boolean[] = [];
    transport.sendTyping = (_, typing) => sent.push(typing);
    const { result } = renderHook(() => useTypingStatus(transport, 'c1'));
    act(() => {
      result.current.typed();
      vi.advanceTimersByTime(1000);
      result.current.typed();
      vi.advanceTimersByTime(2500);
      result.current.typed();
    });
    expect(sent).toEqual([true, true]);
    act(() => vi.advanceTimersByTime(5000));
    expect(sent).toEqual([true, true, false]);
  });
});
