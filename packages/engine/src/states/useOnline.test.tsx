// @vitest-environment jsdom
// useOnline (#101): começa pelo navigator.onLine, segue os eventos e solta os ouvintes ao sair.
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useOnline from './useOnline';

afterEach(() => vi.restoreAllMocks());

describe('useOnline', () => {
  it('começa sem rede quando o navegador diz que não há', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(renderHook(() => useOnline()).result.current).toBe(false);
  });

  it('segue offline e online; ouve uma vez só e solta ao desmontar', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { result, rerender, unmount } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    act(() => void window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
    rerender();
    const listened = add.mock.calls.filter(([e]) => e === 'online' || e === 'offline').map(([e]) => e);
    expect(listened).toEqual(['online', 'offline']);
    unmount();
    const released = remove.mock.calls.filter(([e]) => e === 'online' || e === 'offline').map(([e]) => e);
    expect(released).toEqual(['online', 'offline']);
  });
});
