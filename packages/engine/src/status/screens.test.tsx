// @vitest-environment jsdom
// Telas da shell para o sistema fora do ar e para erro (#81): manutenção, em breve, 500, falha ao abrir e 404.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoadErrorScreen, NotFoundScreen, RouteErrorScreen } from './ErrorScreens';
import { AppStatus } from './AppStatus';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const theme = createTheme({ cssVariables: true });
const intl = (node: ReactNode) => (
  <ThemeProvider theme={theme}>
    <IntlProvider locale="pt-BR" timeZone="UTC" onError={() => {}}>
      {node}
    </IntlProvider>
  </ThemeProvider>
);
/** A tela cheia tem altura mínima (100vh); a do conteúdo, não. */
const minHeight = (el: Element | null) => getComputedStyle(el as HTMLElement).minHeight;

const routed = (element: ReactNode, errorElement?: ReactNode) =>
  render(intl(<RouterProvider router={createMemoryRouter([{ path: '/', element, errorElement }])} />));

describe('AppStatus', () => {
  it('manutenção sem textos: o título padrão, sem previsão e sem botão sem onRetry', () => {
    render(intl(<AppStatus status={{ mode: 'maintenance' }} />));
    expect(screen.getByRole('heading', { name: 'Em manutenção' })).toBeTruthy();
    expect(screen.queryByText(/Previsão de retorno/)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('timer')).toBeNull();
  });

  it('manutenção com textos, previsão e "Tentar de novo"; ao chegar a hora, pergunta sozinha', () => {
    vi.useFakeTimers({ now: Date.parse('2026-11-12T12:00:00Z'), toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const onRetry = vi.fn();
    const status = {
      mode: 'maintenance',
      title: 'Parada programada',
      message: 'Trocando o servidor.',
      until: '2026-11-12T12:30:00Z'
    } as const;
    render(intl(<AppStatus status={status} onRetry={onRetry} />));
    expect(screen.getByRole('heading', { name: 'Parada programada' })).toBeTruthy();
    expect(screen.getByText('Trocando o servidor.')).toBeTruthy();
    expect(screen.getByText(/^Previsão de retorno: 12 de novembro de 2026.*12:30$/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(29 * 60_000));
    expect(onRetry).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(60_000));
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('manutenção com a previsão já passada: mostra a hora e não pergunta sozinha', () => {
    vi.useFakeTimers({ now: Date.parse('2026-11-12T12:00:00Z'), toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const onRetry = vi.fn();
    render(intl(<AppStatus status={{ mode: 'maintenance', until: '2026-11-12T11:00:00Z' }} onRetry={onRetry} />));
    expect(screen.getByText(/^Previsão de retorno: .*11:00$/)).toBeTruthy();
    act(() => void vi.advanceTimersByTime(3_600_000));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('em breve: contagem até a data, sem "Tentar de novo", e pergunta de novo ao zerar', () => {
    vi.useFakeTimers({
      now: Date.parse('2026-11-12T12:00:00Z'),
      toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date']
    });
    const onRetry = vi.fn();
    render(intl(<AppStatus status={{ mode: 'comingSoon', until: '2026-11-12T12:00:02Z' }} onRetry={onRetry} />));
    expect(screen.getByRole('heading', { name: 'Em breve' })).toBeTruthy();
    expect(screen.getByRole('timer')).toBeTruthy();
    expect(screen.getByText(/^Lançamento: /)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    act(() => void vi.advanceTimersByTime(2000));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('manutenção: a hora nova troca o aviso marcado, e desmontar cancela', () => {
    vi.useFakeTimers({ now: Date.parse('2026-11-12T12:00:00Z'), toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const onRetry = vi.fn();
    const at = (until: string) => intl(<AppStatus status={{ mode: 'maintenance', until }} onRetry={onRetry} />);
    const r = render(at('2026-11-12T12:01:00Z'));
    r.rerender(at('2026-11-12T12:03:00Z'));
    act(() => void vi.advanceTimersByTime(2 * 60_000));
    expect(onRetry).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(60_000));
    expect(onRetry).toHaveBeenCalledTimes(1);
    r.rerender(at('2026-11-12T12:10:00Z'));
    r.unmount();
    act(() => void vi.advanceTimersByTime(3_600_000));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('manutenção sem previsão não marca nada', () => {
    vi.useFakeTimers({ now: 0, toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const onRetry = vi.fn();
    render(intl(<AppStatus status={{ mode: 'maintenance' }} onRetry={onRetry} />));
    act(() => void vi.advanceTimersByTime(3_600_000));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('em breve com a data passada ou sem data: sem contagem; fora da tela cheia não ocupa 100vh', () => {
    const { container } = render(intl(<AppStatus fullScreen={false} status={{ mode: 'comingSoon', until: '2020-01-01T00:00:00Z' }} />));
    expect(screen.queryByRole('timer')).toBeNull();
    expect(minHeight(container.firstElementChild)).toMatch(/^(auto)?$/);
    cleanup();
    const full = render(intl(<AppStatus status={{ mode: 'comingSoon' }} />));
    expect(screen.queryByRole('timer')).toBeNull();
    expect(minHeight(full.container.firstElementChild)).not.toMatch(/^(auto)?$/);
  });
});

describe('telas de erro', () => {
  function Boom(): ReactNode {
    throw new Error('quebrou');
  }

  it('erro numa rota: 500 com "Tentar de novo" (recarrega) e "Voltar ao início"; o erro vai ao console', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    routed(<Boom />, <RouteErrorScreen />);
    expect(await screen.findByText('500')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Algo deu errado' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voltar ao início' }).getAttribute('href')).toBe('/');
    expect(log.mock.calls.some(([e]) => e instanceof Error && e.message === 'quebrou')).toBe(true);
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('a moldura quebrou: o 500 ocupa a tela toda', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = routed(<Boom />, <RouteErrorScreen fullScreen />);
    await screen.findByText('500');
    expect(minHeight(container.firstElementChild)).not.toMatch(/^(auto)?$/);
  });

  it('falha ao abrir: código grande só em 5xx, a mensagem e "Tentar de novo"', () => {
    const onRetry = vi.fn();
    render(intl(<LoadErrorScreen message="Erro 502." httpStatus={502} onRetry={onRetry} />));
    expect(screen.getByText('502')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Não foi possível abrir o sistema' })).toBeTruthy();
    expect(screen.getByText('Erro 502.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    cleanup();
    render(intl(<LoadErrorScreen message="Sem conexão com o servidor." httpStatus={0} onRetry={onRetry} />));
    expect(screen.queryByText('0')).toBeNull();
    cleanup();
    render(intl(<LoadErrorScreen message="Erro 404." httpStatus={404} onRetry={onRetry} />));
    expect(screen.queryByText('404')).toBeNull();
    cleanup();
    render(intl(<LoadErrorScreen message="x" httpStatus={500} onRetry={onRetry} />));
    expect(screen.getByText('500')).toBeTruthy();
    cleanup();
    render(intl(<LoadErrorScreen message="x" onRetry={onRetry} />));
    expect(screen.queryByText('500')).toBeNull();
  });

  it('404 com "Voltar ao início"', async () => {
    routed(<NotFoundScreen />);
    expect(await screen.findByText('404')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeTruthy();
  });
});
