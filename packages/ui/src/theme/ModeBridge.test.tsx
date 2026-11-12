// @vitest-environment jsdom
// #112: o app troca o modo de fora sem remontar e fica sabendo quando a pessoa troca pela casca.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import C3ThemeProvider from '../C3ThemeProvider';
import type { ModeChange } from './ModeBridge';
import useColorMode, { ColorModePreference } from './useColorMode';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

function systemMode(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    matches: dark && query === '(prefers-color-scheme: dark)',
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

let mounts = 0;

function Screen() {
  const { mode, preference, setPreference } = useColorMode();
  const [draft, setDraft] = useState('');
  const [mountId] = useState(() => ++mounts);
  return (
    <>
      <output aria-label="modo">{`${preference}:${mode}`}</output>
      <output aria-label="montagem">{mountId}</output>
      <input aria-label="rascunho" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button onClick={() => setPreference('dark')}>Escuro pela casca</button>
    </>
  );
}

function App({ mode, onModeChange }: { mode?: ColorModePreference; onModeChange?: (c: ModeChange) => void }) {
  return (
    <C3ThemeProvider storageKey="bridge" mode={mode} onModeChange={onModeChange}>
      <Screen />
    </C3ThemeProvider>
  );
}

const modeText = () => screen.getByLabelText('modo').textContent;

describe('modo controlado de fora da casca', () => {
  it('trocar mode por fora não remonta: o rascunho continua e a escolha fica salva', async () => {
    systemMode(false);
    const view = render(<App />);
    await waitFor(() => expect(modeText()).toBe('system:light'));
    const mountId = screen.getByLabelText('montagem').textContent;
    fireEvent.change(screen.getByLabelText('rascunho'), { target: { value: 'meio do texto' } });

    view.rerender(<App mode="dark" />);
    await waitFor(() => expect(modeText()).toBe('dark:dark'));
    expect(document.documentElement.getAttribute('data-c3-mode')).toBe('dark');
    expect(screen.getByLabelText('montagem').textContent).toBe(mountId);
    expect((screen.getByLabelText('rascunho') as HTMLInputElement).value).toBe('meio do texto');
    expect(localStorage.getItem('bridge-mode')).toBe('dark');

    view.rerender(<App mode="light" />);
    await waitFor(() => expect(modeText()).toBe('light:light'));
    expect(localStorage.getItem('bridge-mode')).toBe('light');
  });

  it('sem mode, a escolha salva da pessoa continua valendo', async () => {
    systemMode(false);
    localStorage.setItem('bridge-mode', 'dark');
    render(<App />);
    await waitFor(() => expect(modeText()).toBe('dark:dark'));
  });

  it('onModeChange avisa a troca feita pela casca, sem avisar a abertura', async () => {
    systemMode(false);
    const onModeChange = vi.fn();
    render(<App onModeChange={onModeChange} />);
    await waitFor(() => expect(modeText()).toBe('system:light'));
    expect(onModeChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Escuro pela casca' }));
    await waitFor(() => expect(onModeChange).toHaveBeenCalledWith({ preference: 'dark', mode: 'dark' }));
    expect(onModeChange).toHaveBeenCalledTimes(1);
  });

  it('a troca pela casca vale mesmo com mode fixo, até o app mandar outro valor', async () => {
    systemMode(false);
    const onModeChange = vi.fn();
    const view = render(<App mode="light" onModeChange={onModeChange} />);
    await waitFor(() => expect(modeText()).toBe('light:light'));
    fireEvent.click(screen.getByRole('button', { name: 'Escuro pela casca' }));
    await waitFor(() => expect(modeText()).toBe('dark:dark'));
    view.rerender(<App mode="light" onModeChange={onModeChange} />);
    expect(modeText()).toBe('dark:dark');
    view.rerender(<App mode="system" onModeChange={onModeChange} />);
    await waitFor(() => expect(modeText()).toBe('system:light'));
    expect(onModeChange).toHaveBeenLastCalledWith({ preference: 'system', mode: 'light' });
  });
});
