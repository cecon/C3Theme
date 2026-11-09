// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PeriodFilter, { type PeriodFilterProps } from './PeriodFilter';
import { isoDate, shortcutPeriod } from './period';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const bar = (props: Partial<PeriodFilterProps> = {}) => {
  const on = { onChange: vi.fn(), onFilter: vi.fn(), onPrint: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <PeriodFilter value={{ from: '2026-11-01', to: '2026-11-09' }} {...on} {...props} />
      </IntlProvider>
    </ThemeProvider>
  );
  return on;
};

describe('PeriodFilter', () => {
  it('Filtrar aplica o período válido; Imprimir chama a impressão; o papel diz o período', () => {
    const on = bar();
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));
    expect(on.onFilter).toHaveBeenCalledWith({ from: '2026-11-01', to: '2026-11-09' });
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(on.onPrint).toHaveBeenCalled();
    expect(screen.getByText('Período: 01/11/2026 a 09/11/2026')).toBeTruthy();
  });

  it('início depois do fim: avisa no campo e não deixa filtrar', () => {
    const on = bar({ value: { from: '2026-11-10', to: '2026-11-01' } });
    expect(screen.getByText('Início depois do fim.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Filtrar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(screen.getByRole('button', { name: 'Filtrar' }).closest('form')!);
    expect(on.onFilter).not.toHaveBeenCalled();
  });

  it('obrigatório sem datas: não filtra; sem onPrint, sem botão de imprimir; papel mostra reticências', () => {
    const on = bar({ value: { from: null, to: null }, required: true, onPrint: false });
    expect((screen.getByRole('button', { name: 'Filtrar' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Imprimir' })).toBeNull();
    expect(screen.getByText('Período: … a …')).toBeTruthy();
    expect(on.onFilter).not.toHaveBeenCalled();
  });

  it('atalho preenche e filtra no mesmo clique, e fica marcado quando é o período atual', () => {
    const today = shortcutPeriod('today');
    const on = bar({ value: today, shortcuts: true });
    expect(screen.getByRole('button', { name: 'Hoje' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Últimos 7 dias' }));
    const last7 = shortcutPeriod('last7');
    expect(on.onChange).toHaveBeenCalledWith(last7);
    expect(on.onFilter).toHaveBeenCalledWith(last7);
    expect(last7.to).toBe(isoDate(new Date()));
  });

  it('digitar a data avisa a mudança do campo', () => {
    const on = bar();
    fireEvent.change(screen.getByRole('textbox', { name: /^De/ }), { target: { value: '05/11/2026' } });
    expect(on.onChange).toHaveBeenCalledWith({ from: '2026-11-05', to: '2026-11-09' });
  });
});
