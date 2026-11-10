// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { EntityDef } from '../../types';
import { useUrlSourceParams } from './sourceParams';

const def = {
  name: 'pendencias',
  label: { singular: 'Pendência', plural: 'Pendências' },
  source: 'system',
  params: { fields: [{ name: 'until', type: 'date' }] },
  fields: []
} as unknown as EntityDef;
const at =
  (url: string) =>
  ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;

describe('useUrlSourceParams', () => {
  it('lê os parâmetros da URL da lista só quando ligado', () => {
    expect(renderHook(() => useUrlSourceParams(def, true), { wrapper: at('/pendencias?p.until=2020-02-15') }).result.current).toEqual({
      until: '2020-02-15'
    });
    expect(
      renderHook(() => useUrlSourceParams(def, false), { wrapper: at('/pendencias?p.until=2020-02-15') }).result.current
    ).toBeUndefined();
  });
});
