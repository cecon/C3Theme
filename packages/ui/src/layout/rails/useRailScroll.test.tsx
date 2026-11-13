// @vitest-environment jsdom
import { act, renderHook, cleanup } from '@testing-library/react';
import type { DragEvent } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import useRailScroll from './useRailScroll';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('sombras seguem as bordas e arraste rola até sair ou soltar', () => {
  vi.useFakeTimers();
  const el = document.createElement('div');
  Object.defineProperties(el, { clientHeight: { value: 100 }, scrollHeight: { value: 1000 } });
  el.getBoundingClientRect = () => ({ top: 0, bottom: 100 }) as DOMRect;
  const { result } = renderHook(() => useRailScroll({ current: el }, 20));
  expect(result.current.shadow).toContain('inset 0 -8px');
  const event = { clientY: 99, preventDefault: vi.fn() } as unknown as DragEvent<HTMLDivElement>;
  act(() => result.current.dragOver(event));
  act(() => vi.advanceTimersByTime(100));
  expect(el.scrollTop).toBe(48);
  expect(result.current.shadow).toContain('inset 0 8px');
  act(() => result.current.stop());
  act(() => vi.advanceTimersByTime(100));
  expect(el.scrollTop).toBe(48);
  act(() => result.current.dragOver({ ...event, clientY: 1 }));
  act(() => vi.advanceTimersByTime(50));
  expect(el.scrollTop).toBe(24);
  act(() => window.dispatchEvent(new Event('dragend')));
  act(() => vi.advanceTimersByTime(50));
  expect(el.scrollTop).toBe(24);
});
it('lista ainda não montada não deixa temporizador ativo', () => {
  const { result } = renderHook(() => useRailScroll({ current: null }, 0));
  expect(result.current.shadow).toBe('none');
  expect(() => act(() => result.current.dragOver({ clientY: 1 } as DragEvent<HTMLDivElement>))).not.toThrow();
});
