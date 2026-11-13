// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import useIconCatalog from './useIconCatalog';
import type { C3Icons } from '../context';

afterEach(cleanup);

it('usa apenas o catálogo explícito e não mantém ícones do app anterior', () => {
  const Box = () => null;
  const icons = { Box };
  const { result, rerender } = renderHook(({ icons }: { icons?: C3Icons }) => useIconCatalog(icons), {
    initialProps: { icons } as { icons?: C3Icons }
  });
  expect(result.current).toBe(icons);
  rerender({ icons: undefined });
  expect(result.current).toBeUndefined();
  const other = { Home: Box };
  rerender({ icons: other });
  expect(result.current).toBe(other);
});
