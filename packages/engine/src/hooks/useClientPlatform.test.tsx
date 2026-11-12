// @vitest-environment jsdom
// #110: a plataforma vem do app (ou do desktopHost); sem ela, celular em tela estreita e site no resto.
import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import C3Shell from '../C3Shell';
import { EngineProvider, type EngineState } from '../context';
import useClientPlatform, { onPlatform } from './useClientPlatform';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function screenWidth(narrow: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: narrow && query.includes('max-width'),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

const wrap = (platform?: EngineState['platform']) =>
  function Wrap({ children }: { children: ReactNode }) {
    return (
      <EngineProvider value={{ client: {} as never, app: {} as never, entities: {}, components: {}, platform }}>{children}</EngineProvider>
    );
  };

describe('useClientPlatform', () => {
  it('vale o que o app disse', () => {
    screenWidth(true);
    expect(renderHook(() => useClientPlatform(), { wrapper: wrap('desktop') }).result.current).toBe('desktop');
  });
  it('sem o app: estreita é celular, larga é site', () => {
    screenWidth(true);
    expect(renderHook(() => useClientPlatform(), { wrapper: wrap() }).result.current).toBe('mobile');
    screenWidth(false);
    expect(renderHook(() => useClientPlatform(), { wrapper: wrap() }).result.current).toBe('web');
  });
  it('seção sem platforms aparece em todas', () => {
    expect(onPlatform({}, 'mobile')).toBe(true);
    expect(onPlatform({ platforms: ['desktop'] }, 'web')).toBe(false);
    expect(onPlatform({ platforms: ['web', 'mobile'] }, 'mobile')).toBe(true);
  });
});

describe('platform na C3Shell', () => {
  const app = { name: 'C3', entities: [], pages: [{ path: '/probe', component: 'Probe' }], layout: { menu: [] } };
  const transport = vi.fn(async () => new Response(JSON.stringify({ data: app }), { headers: { 'content-type': 'application/json' } }));
  const Probe = () => <output aria-label="plataforma">{useClientPlatform()}</output>;

  it('a porta desktopHost faz desktop; a prop platform vence', async () => {
    screenWidth(false);
    window.scrollTo = vi.fn();
    window.history.replaceState(null, '', '/probe');
    const first = render(<C3Shell apiUrl="/api" transport={transport} components={{ Probe }} desktopHost={{ platform: 'mac' }} />);
    await waitFor(() => expect(screen.getByLabelText('plataforma').textContent).toBe('desktop'));
    first.unmount();
    render(<C3Shell apiUrl="/api" transport={transport} components={{ Probe }} desktopHost={{ platform: 'mac' }} platform="web" />);
    await waitFor(() => expect(screen.getByLabelText('plataforma').textContent).toBe('web'));
  });
});
