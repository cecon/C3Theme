// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProviderList, { type ProviderListProps } from './ProviderList';
import type { ProviderItem } from './types';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const ALL: ProviderItem[] = [
  { id: 'claude', name: 'Claude Code', status: 'ready', detail: 'v2.1' },
  { id: 'codex', name: 'Codex', status: 'needs-login' },
  { id: 'opencode', name: 'OpenCode', status: 'missing', detail: 'npm i -g opencode' },
  { id: 'ollama', name: 'Ollama', status: 'installing', progress: 40 },
  { id: 'lms', name: 'LM Studio', status: 'error', error: 'Sem espaço no disco.' },
  { id: 'x', name: 'Gemini', status: 'signing-in' },
  { id: 'y', name: 'Aider', status: 'installed' }
];
const wrap = (props: Partial<ProviderListProps> = {}) => {
  const all = {
    providers: ALL,
    onInstall: vi.fn(),
    onSignIn: vi.fn(),
    onRetry: vi.fn(),
    onRefresh: vi.fn(),
    onCheckUpdate: vi.fn(),
    onRemove: vi.fn(),
    ...props
  };
  const view = (p: ProviderListProps) => (
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <ProviderList {...p} />
      </IntlProvider>
    </ThemeProvider>
  );
  const r = render(view(all));
  return { ...all, rerender: (p: Partial<ProviderListProps>) => r.rerender(view({ ...all, ...p })) };
};

describe('ProviderList', () => {
  it('cada ação dispara o callback com o id', () => {
    const h = wrap();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar: OpenCode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar: Codex' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo: LM Studio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Procurar de novo' }));
    expect(h.onInstall).toHaveBeenCalledWith('opencode');
    expect(h.onSignIn).toHaveBeenCalledWith('codex');
    expect(h.onRetry).toHaveBeenCalledWith('lms');
    expect(h.onRefresh).toHaveBeenCalledOnce();
  });

  it('menu da linha atualiza e remove', () => {
    const h = wrap();
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações: Claude Code' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Procurar atualização' }));
    expect(h.onCheckUpdate).toHaveBeenCalledWith('claude');
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações: Aider' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover' }));
    expect(h.onRemove).toHaveBeenCalledWith('y');
    expect(screen.queryByRole('button', { name: 'Mais ações: OpenCode' })).toBeNull();
  });

  it('progresso anunciado com valor e texto; erro descreve o botão', () => {
    wrap();
    const bars = screen.getAllByRole('progressbar');
    const bar = bars.find((b) => b.getAttribute('aria-valuenow') === '40')!;
    expect(bar.getAttribute('aria-valuetext')).toBe('Ollama: baixando, 40%');
    expect(bar.getAttribute('aria-labelledby')).toBeTruthy();
    const retry = screen.getByRole('button', { name: 'Tentar de novo: LM Studio' });
    expect(document.getElementById(retry.getAttribute('aria-describedby')!)?.textContent).toBe('Sem espaço no disco.');
  });

  it('mostra o selo de cada estado', () => {
    wrap();
    for (const s of ['Pronto', 'Falta entrar', 'Não instalado', 'Baixando', 'Erro', 'Entrando', 'Instalado'])
      expect(screen.getByText(s)).toBeTruthy();
  });

  it('região viva fala a troca de estado e o progresso', () => {
    const h = wrap();
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    h.rerender({
      providers: ALL.map((p) => (p.id === 'ollama' ? { ...p, progress: 80 } : p.id === 'codex' ? { ...p, status: 'ready' } : p))
    });
    expect(status.textContent).toBe('Codex: Pronto. Ollama: baixando, 75%');
  });

  it('sem callback a ação some; procurando desabilita o rodapé; lista vazia', () => {
    wrap({ onInstall: undefined, refreshing: true, providers: [ALL[2]] });
    expect(screen.queryByRole('button', { name: /Baixar/ })).toBeNull();
    expect((screen.getByRole('button', { name: 'Procurar de novo' }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    wrap({ providers: [] });
    expect(screen.getByText('Nenhum programa encontrado.')).toBeTruthy();
  });
});
