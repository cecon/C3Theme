// @vitest-environment jsdom
// #96: o modo do app é só a escolha inicial; a preferência persistida da pessoa continua vencendo.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import C3ThemeProvider from '../C3ThemeProvider';
import useColorMode from './useColorMode';

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

function Mode() {
  const { mode, preference, setPreference } = useColorMode();
  return (
    <>
      <output aria-label="modo">{`${preference}:${mode}`}</output>
      <button onClick={() => setPreference('light')}>Usar claro</button>
    </>
  );
}

describe('defaultMode do C3ThemeProvider', () => {
  it.each(['light', 'dark'] as const)('%s vence o modo contrário do sistema na primeira abertura', async (defaultMode) => {
    systemMode(defaultMode === 'light');
    render(
      <C3ThemeProvider storageKey="initial-mode" defaultMode={defaultMode}>
        <Mode />
      </C3ThemeProvider>
    );
    await waitFor(() => expect(screen.getByLabelText('modo').textContent).toBe(`${defaultMode}:${defaultMode}`));
    expect(document.documentElement.getAttribute('data-c3-mode')).toBe(defaultMode);
  });

  it('sem defaultMode mantém system e resolve a preferência escura do sistema', async () => {
    systemMode(true);
    render(
      <C3ThemeProvider storageKey="system-mode">
        <Mode />
      </C3ThemeProvider>
    );
    await waitFor(() => expect(screen.getByLabelText('modo').textContent).toBe('system:dark'));
  });

  it('a pessoa troca o modo e a escolha salva vence defaultMode na próxima abertura', async () => {
    systemMode(false);
    const app = (
      <C3ThemeProvider storageKey="saved-mode" defaultMode="dark">
        <Mode />
      </C3ThemeProvider>
    );
    const first = render(app);
    await waitFor(() => expect(screen.getByLabelText('modo').textContent).toBe('dark:dark'));
    fireEvent.click(screen.getByRole('button', { name: 'Usar claro' }));
    await waitFor(() => expect(screen.getByLabelText('modo').textContent).toBe('light:light'));
    expect(localStorage.getItem('saved-mode-mode')).toBe('light');
    first.unmount();
    render(app);
    await waitFor(() => expect(screen.getByLabelText('modo').textContent).toBe('light:light'));
    expect(document.documentElement.getAttribute('data-c3-mode')).toBe('light');
  });
});
