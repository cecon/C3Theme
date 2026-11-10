// @vitest-environment jsdom
// Conversa por voz ao vivo: estado, legenda, microfone, encerrar e o volume pelo medidor.
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import useAudioLevel, { type LevelMeter } from '../../hooks/useAudioLevel';
import ContextRing from '../composer/ContextRing';
import VoiceConversation from './VoiceConversation';

afterEach(cleanup);

const wrap = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        {ui}
      </IntlProvider>
    </ThemeProvider>
  );

describe('VoiceConversation', () => {
  it('mostra o estado e a última fala; microfone e encerrar chamam o app', () => {
    const onEnd = vi.fn();
    const onToggleMute = vi.fn();
    const captions = [
      { who: 'user' as const, text: 'Quanto vendemos ontem?' },
      { who: 'assistant' as const, text: 'Vendemos R$ 12 mil.' }
    ];
    const { rerender } = wrap(
      <VoiceConversation state="speaking" level={0.5} captions={captions} onEnd={onEnd} onToggleMute={onToggleMute} />
    );
    expect(screen.getByRole('status').textContent).toBe('Falando');
    expect(screen.getByText('Vendemos R$ 12 mil.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desligar microfone' }));
    expect(onToggleMute).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar conversa por voz' }));
    expect(onEnd).toHaveBeenCalled();
    rerender(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <VoiceConversation state="listening" muted onEnd={onEnd} onToggleMute={onToggleMute} />
        </IntlProvider>
      </ThemeProvider>
    );
    expect(screen.getByRole('status').textContent).toBe('Microfone desligado');
    expect(screen.getByRole('button', { name: 'Ligar microfone' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('erro mostra o texto do app, e sem onToggleMute não tem microfone', () => {
    wrap(<VoiceConversation state="error" error="Sem conexão com a voz." onEnd={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toBe('Sem conexão com a voz.');
    expect(screen.queryByRole('button', { name: /microfone/ })).toBeNull();
  });
});

describe('useAudioLevel', () => {
  it('segue o medidor e volta a 0 sem stream', () => {
    let push: (n: number) => void = () => {};
    const stop = vi.fn();
    const meter: LevelMeter = (_s, onLevel) => {
      push = onLevel;
      return stop;
    };
    const stream = {} as MediaStream;
    const { result, rerender } = renderHook(({ s }) => useAudioLevel(s, meter), { initialProps: { s: stream as MediaStream | null } });
    act(() => push(0.7));
    expect(result.current).toBe(0.7);
    rerender({ s: null });
    expect(result.current).toBe(0);
    expect(stop).toHaveBeenCalled();
  });
});

describe('ContextRing', () => {
  it('diz quanto do contexto foi usado, preso entre 0 e 100', () => {
    wrap(<ContextRing used={140} />);
    expect(screen.getByRole('img', { name: '100% do contexto usado' })).toBeTruthy();
  });
});
