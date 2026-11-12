// @vitest-environment jsdom
// Moldura do desktop pelo app.json (#73): a shell junta `layout.desktop` com a porta `desktopHost` e entrega ao
// layout (contexto do motor) e ao tema (fonte e densidade).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { useTheme } from '@mui/material/styles';
import { SYSTEM_FONT } from '@c3theme/ui';

import C3Shell from '../C3Shell';
import { useEngine } from '../context';
import type { AuthPort } from '../auth/port';
import type { DesktopDef } from './frame';

// o AppLayout volta ao topo a cada rota; o jsdom não rola
beforeAll(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });

const appWith = (desktop?: DesktopDef) => ({
  specVersion: '0',
  name: 'Oficina',
  homePath: '/sonda',
  entities: [],
  pages: [{ path: '/sonda', component: 'Sonda' }],
  layout: { menu: [{ items: [{ label: 'Sonda', path: '/sonda' }] }], ...(desktop && { desktop }) }
});

const transportFor = (app: unknown) =>
  vi.fn(async (url: string) => (url.endsWith('/_meta/app') ? json({ data: app }) : json({ data: {} })));

// a página registrada lê o que a shell montou: a moldura no contexto e a fonte no tema
function Sonda() {
  const { desktop } = useEngine();
  const theme = useTheme();
  return (
    <>
      <output aria-label="moldura">{JSON.stringify(desktop ?? null)}</output>
      <output aria-label="fonte">{theme.typography.fontFamily}</output>
    </>
  );
}

const shown = async (label: string) => (await screen.findByLabelText(label)).textContent;

describe('C3Shell com layout.desktop', () => {
  it('com a porta, a declaração vira a moldura do layout e os tokens do tema', async () => {
    window.history.replaceState(null, '', '/sonda');
    const app = appWith({ translucent: true, drawerFrom: 800 });
    render(<C3Shell apiUrl="/api" transport={transportFor(app)} components={{ Sonda }} desktopHost={{ platform: 'mac', notch: 200 }} />);
    expect(JSON.parse((await shown('moldura'))!)).toEqual({
      options: { platform: 'mac', translucent: true, drawerFrom: 800 },
      tokens: { fontFamily: SYSTEM_FONT, density: 'compact' },
      notch: 200
    });
    expect(await shown('fonte')).toBe(SYSTEM_FONT);
  });

  it('sem a porta (navegador), a declaração é ignorada e a fonte do sistema vence só pelo theme.tokens', async () => {
    window.history.replaceState(null, '', '/sonda');
    render(
      <C3Shell apiUrl="/api" transport={transportFor(appWith({}))} components={{ Sonda }} theme={{ tokens: { fontFamily: 'Inter' } }} />
    );
    expect(await shown('moldura')).toBe('null');
    expect(await shown('fonte')).toBe('Inter');
  });

  it('a prop antiga `desktop` vence a declaração e não mexe no tema', async () => {
    window.history.replaceState(null, '', '/sonda');
    const app = appWith({ titleBar: 'system' });
    render(
      <C3Shell
        apiUrl="/api"
        transport={transportFor(app)}
        components={{ Sonda }}
        desktop={{ platform: 'windows' }}
        desktopHost={{ platform: 'mac' }}
      />
    );
    expect(JSON.parse((await shown('moldura'))!)).toEqual({ options: { platform: 'windows' }, tokens: {} });
    expect(await shown('fonte')).not.toBe(SYSTEM_FONT);
  });
});

describe('telas de entrada no desktop', () => {
  const port: AuthPort = { login: vi.fn(), me: vi.fn().mockResolvedValue(null) } as unknown as AuthPort;
  const login = { data: { name: 'Oficina', auth: {} } };
  const transport = vi.fn(async () => json(login));

  it('com a porta, a faixa de arrastar a janela aparece antes de entrar; sem ela, não', async () => {
    const { unmount } = render(<C3Shell apiUrl="/api" auth={port} transport={transport} desktopHost={{ platform: 'mac' }} />);
    await screen.findByRole('button', { name: /entrar/i });
    expect(document.querySelector('[data-window-drag]')).not.toBeNull();
    unmount();
    render(<C3Shell apiUrl="/api" auth={port} transport={transport} />);
    await screen.findByRole('button', { name: /entrar/i });
    expect(document.querySelector('[data-window-drag]')).toBeNull();
  });
});
