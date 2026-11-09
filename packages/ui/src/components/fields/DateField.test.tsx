// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DateField from './DateField';

afterEach(cleanup);

function Harness({ locale, initial, spy }: { locale: string; initial: string | null; spy: (v: string | null) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale={locale} onError={() => {}}>
        <DateField
          label="Entrega"
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

const input = () => screen.getByLabelText('Entrega') as HTMLInputElement;

describe('DateField', () => {
  it('mostra dd/mm/aaaa no app em pt-BR, qualquer que seja o navegador', () => {
    render(<Harness locale="pt-BR" initial="2026-10-31" spy={vi.fn()} />);
    expect(input().value).toBe('31/10/2026');
    expect(input().placeholder).toBe('dd/mm/aaaa');
  });

  it('grava ISO só com a data completa e avisa ao sair com ela incompleta', () => {
    const spy = vi.fn();
    render(<Harness locale="pt-BR" initial={null} spy={spy} />);
    fireEvent.change(input(), { target: { value: '0511' } });
    expect(input().value).toBe('05/11/');
    expect(spy).not.toHaveBeenCalled();
    fireEvent.blur(input());
    expect(screen.getByText('Data inválida.')).toBeTruthy();
    fireEvent.change(input(), { target: { value: '05112026' } });
    expect(spy).toHaveBeenLastCalledWith('2026-11-05');
    expect(screen.queryByText('Data inválida.')).toBeNull();
  });

  it('escolhe no calendário', () => {
    const spy = vi.fn();
    render(<Harness locale="pt-BR" initial="2026-10-10" spy={spy} />);
    fireEvent.click(screen.getByLabelText('Abrir calendário'));
    expect(screen.getByText('Outubro de 2026')).toBeTruthy();
    fireEvent.click(screen.getByText('20'));
    expect(spy).toHaveBeenLastCalledWith('2026-10-20');
    expect(input().value).toBe('20/10/2026');
  });
});
