// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { memoryDrafts } from '../adapters/localStorageDrafts';
import useDraft from './useDraft';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDraft', () => {
  it('guarda com atraso e devolve ao voltar para a conversa', () => {
    const storage = memoryDrafts();
    const { result, rerender } = renderHook(({ id }) => useDraft(id, storage, 400), { initialProps: { id: 'c1' } });
    act(() => result.current.setText('meio escrito'));
    expect(storage.get('c1')).toBe('');
    act(() => vi.advanceTimersByTime(400));
    expect(storage.get('c1')).toBe('meio escrito');

    rerender({ id: 'c2' });
    expect(result.current.text).toBe('');
    rerender({ id: 'c1' });
    expect(result.current.text).toBe('meio escrito');
  });

  it('trocar de conversa antes do atraso grava na hora', () => {
    const storage = memoryDrafts();
    const { result, rerender } = renderHook(({ id }) => useDraft(id, storage), { initialProps: { id: 'c1' } });
    act(() => result.current.setText('rápido'));
    rerender({ id: 'c2' });
    expect(storage.get('c1')).toBe('rápido');
    expect(storage.get('c2')).toBe('');
  });

  it('clear limpa o campo e o guardado', () => {
    const storage = memoryDrafts();
    storage.set('c1', 'antigo');
    const { result } = renderHook(() => useDraft('c1', storage));
    expect(result.current.text).toBe('antigo');
    act(() => result.current.clear());
    expect(result.current.text).toBe('');
    expect(storage.get('c1')).toBe('');
  });
});
