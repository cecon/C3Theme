// @vitest-environment jsdom
// `link` na resposta da ação (#31): a shell abre o endereço na mesma aba.
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import useActionReply, { linkPort } from './useActionReply';

describe('useActionReply com link', () => {
  it('abre o endereço; sem link, nada', () => {
    const open = vi.spyOn(linkPort, 'open').mockImplementation(() => {});
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result } = renderHook(() => useActionReply(), { wrapper });
    result.current({ message: 'ok' });
    result.current({ link: '/downloads/pdv.exe' });
    expect(open.mock.calls).toEqual([['/downloads/pdv.exe']]);
  });
});
