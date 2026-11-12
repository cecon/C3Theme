// @vitest-environment jsdom
// #112: o app troca o modo de uma casca montada pelo `theme.mode` e ouve a troca feita pela pessoa.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { ModeChange } from '@c3theme/ui';
import C3Shell from './C3Shell';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  window.scrollTo = vi.fn();
  window.history.replaceState(null, '', '/probe');
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

const app = { name: 'C3', entities: [], pages: [{ path: '/probe', component: 'Probe' }], layout: { menu: [] } };
const transport = vi.fn(async () => new Response(JSON.stringify({ data: app }), { headers: { 'content-type': 'application/json' } }));

function Probe() {
  const [draft, setDraft] = useState('');
  return <input aria-label="rascunho" value={draft} onChange={(e) => setDraft(e.target.value)} />;
}

function Shell({ mode, onModeChange }: { mode?: 'light' | 'dark'; onModeChange?: (c: ModeChange) => void }) {
  return <C3Shell apiUrl="/api" transport={transport} theme={{ storageKey: 'shell-ctl', mode, onModeChange }} components={{ Probe }} />;
}

it('theme.mode troca o modo da casca montada sem perder o que a pessoa digitou', async () => {
  const view = render(<Shell />);
  const input = await screen.findByLabelText('rascunho');
  fireEvent.change(input, { target: { value: 'meio do texto' } });

  view.rerender(<Shell mode="dark" />);
  await waitFor(() => expect(document.documentElement.getAttribute('data-c3-mode')).toBe('dark'));
  expect(screen.getByLabelText('rascunho')).toBe(input);
  expect((input as HTMLInputElement).value).toBe('meio do texto');
  expect(localStorage.getItem('shell-ctl-mode')).toBe('dark');
});

it('theme.onModeChange avisa quando a pessoa troca pelo botão da casca', async () => {
  const onModeChange = vi.fn();
  render(<Shell onModeChange={onModeChange} />);
  await screen.findByLabelText('rascunho');
  fireEvent.click(screen.getByRole('button', { name: 'Alternar modo claro e escuro' }));
  await waitFor(() => expect(onModeChange).toHaveBeenCalledWith({ preference: 'dark', mode: 'dark' }));
});
