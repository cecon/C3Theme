// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useQrModules } from './useQrModules';

describe('useQrModules (#121: gerador de QR baixa à parte)', () => {
  it('começa vazio e desenha quando o gerador chega; o próximo QR já sai pronto', async () => {
    const first = renderHook(() => useQrModules('abc', 4));
    expect(first.result.current).toEqual({ modules: [], d: '' });
    await waitFor(() => expect(first.result.current.modules.length).toBeGreaterThan(0));
    expect(first.result.current.d).toMatch(/^M\d+ \d+h/);

    const second = renderHook(() => useQrModules('abc', 4));
    expect(second.result.current.modules).toEqual(first.result.current.modules);
    expect(second.result.current.d).toBe(first.result.current.d);
  });

  it('a margem desloca o caminho e texto vazio não desenha', async () => {
    const { result, rerender } = renderHook(({ value, quiet }) => useQrModules(value, quiet), { initialProps: { value: 'x', quiet: 0 } });
    await waitFor(() => expect(result.current.d).not.toBe(''));
    expect(result.current.d.startsWith('M0 0')).toBe(true);
    rerender({ value: 'x', quiet: 4 });
    expect(result.current.d.startsWith('M4 4')).toBe(true);
    rerender({ value: '', quiet: 4 });
    expect(result.current).toEqual({ modules: [], d: '' });
  });
});
