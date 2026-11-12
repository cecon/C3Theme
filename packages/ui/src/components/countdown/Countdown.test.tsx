// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Countdown from './Countdown';
import { countdownParts, twoDigits } from './parts';

describe('countdownParts', () => {
  it('quebra o que falta em dias, horas, minutos e segundos', () => {
    const left = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000 + 999;
    expect(countdownParts(left, 0)).toEqual([
      { unit: 'days', value: 2 },
      { unit: 'hours', value: 3 },
      { unit: 'minutes', value: 4 },
      { unit: 'seconds', value: 5 }
    ]);
  });

  it('já passou: tudo zero', () => {
    expect(countdownParts(0, 5000).map((p) => p.value)).toEqual([0, 0, 0, 0]);
  });

  it('dois dígitos', () => {
    expect(twoDigits(7)).toBe('07');
    expect(twoDigits(123)).toBe('123');
  });
});

describe('<Countdown>', () => {
  beforeEach(() => vi.useFakeTimers({ now: 0, toFake: ['setInterval', 'clearInterval', 'Date'] }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const view = (until: number, onDone?: () => void) =>
    render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Countdown until={until} onDone={onDone} />
      </IntlProvider>
    );

  it('conta a cada segundo e avisa uma vez ao chegar a zero', () => {
    const onDone = vi.fn();
    view(2000, onDone);
    const timer = screen.getByRole('timer', { name: 'Contagem regressiva' });
    expect(timer.textContent).toBe('00dias00horas00min02seg');
    act(() => void vi.advanceTimersByTime(1000));
    expect(timer.textContent).toContain('01seg');
    expect(onDone).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1000));
    expect(timer.textContent).toContain('00seg');
    // no instante exato do fim, já avisa
    expect(onDone).toHaveBeenCalledTimes(1);
    act(() => void vi.advanceTimersByTime(5000));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('já tinha passado ao montar: mostra zero e não avisa', () => {
    const onDone = vi.fn();
    view(-1000, onDone);
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByRole('timer').textContent).toBe('00dias00horas00min00seg');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('aceita data e texto ISO', () => {
    render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Countdown until={new Date(3_600_000)} />
        <Countdown until="1970-01-02T00:00:00Z" />
      </IntlProvider>
    );
    const [a, b] = screen.getAllByRole('timer');
    expect(a!.textContent).toBe('00dias01horas00min00seg');
    expect(b!.textContent).toBe('01dias00horas00min00seg');
  });

  it('termina no instante em que monta: não avisa', () => {
    const onDone = vi.fn();
    view(0, onDone);
    act(() => void vi.advanceTimersByTime(3000));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('sem onDone, chegar a zero não quebra', () => {
    view(1000);
    expect(() => act(() => void vi.advanceTimersByTime(2000))).not.toThrow();
    expect(screen.getByRole('timer').textContent).toBe('00dias00horas00min00seg');
  });

  it('avisa o onDone mais novo, para de contar ao desmontar e recomeça quando a data muda', () => {
    const first = vi.fn();
    const second = vi.fn();
    const r = view(2000, first);
    r.rerender(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Countdown until={2000} onDone={second} />
      </IntlProvider>
    );
    act(() => void vi.advanceTimersByTime(2000));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    const later = vi.fn();
    r.rerender(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Countdown until={5000} onDone={later} />
      </IntlProvider>
    );
    act(() => void vi.advanceTimersByTime(2000));
    expect(later).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(1000));
    expect(later).toHaveBeenCalledTimes(1);

    const gone = vi.fn();
    r.rerender(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <Countdown until={9000} onDone={gone} />
      </IntlProvider>
    );
    r.unmount();
    act(() => void vi.advanceTimersByTime(10_000));
    expect(gone).not.toHaveBeenCalled();
  });
});
