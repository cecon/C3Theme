// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DateTimeField from './DateTimeField';

afterEach(cleanup);

function Harness({ initial, spy }: { initial: string | null; spy: (v: string | null) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <DateTimeField
          label="Visita"
          value={value}
          onChange={(v) => {
            spy(v);
            setValue(v);
          }}
        />
      </IntlProvider>
    </ThemeProvider>
  );
}

const date = () => screen.getByLabelText('Visita') as HTMLInputElement;
const time = () => screen.getByLabelText('Hora') as HTMLInputElement;

describe('DateTimeField', () => {
  it('mostra a data em dd/mm/aaaa e a hora em 24 h', () => {
    render(<Harness initial="2026-10-31T14:30" spy={vi.fn()} />);
    expect(date().value).toBe('31/10/2026');
    expect(time().value).toBe('14:30');
  });

  it('só grava com data e hora completas, e avisa da hora que falta', () => {
    const spy = vi.fn();
    render(<Harness initial={null} spy={spy} />);
    fireEvent.change(date(), { target: { value: '05112026' } });
    expect(spy).not.toHaveBeenCalled();
    fireEvent.blur(time());
    expect(screen.getByText('Hora inválida (00:00 a 23:59).')).toBeTruthy();
    fireEvent.change(time(), { target: { value: '0915' } });
    expect(time().value).toBe('09:15');
    expect(spy).toHaveBeenLastCalledWith('2026-11-05T09:15');
  });
});
