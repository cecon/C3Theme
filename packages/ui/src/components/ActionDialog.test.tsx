// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ActionDialog from './ActionDialog';

afterEach(cleanup);

const theme = createTheme({ cssVariables: true });
const wrap = (props: Partial<Parameters<typeof ActionDialog>[0]> = {}) => {
  const on = { onConfirm: vi.fn(), onClose: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <ActionDialog open title="Cancelar venda" {...on} {...props}>
          <input aria-label="Motivo" />
        </ActionDialog>
      </IntlProvider>
    </ThemeProvider>
  );
  return on;
};

describe('ActionDialog', () => {
  it('o papel é o dialog e o form fica dentro dele (role dialog não vale num <form>)', () => {
    wrap();
    const dialog = screen.getByRole('dialog');
    expect(dialog.tagName).not.toBe('FORM');
    expect(dialog.querySelector('form')).not.toBeNull();
  });

  it('o botão de confirmar envia o form e chama onConfirm', () => {
    const on = wrap();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar venda' }));
    expect(on.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('submit pelo campo (Enter) também confirma, e não sobe para um form de fora', () => {
    const outer = vi.fn();
    const on = { onConfirm: vi.fn(), onClose: vi.fn() };
    render(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="pt-BR" onError={() => {}}>
          <form onSubmit={outer}>
            <ActionDialog open title="Estornar" {...on}>
              <input aria-label="Valor" />
            </ActionDialog>
          </form>
        </IntlProvider>
      </ThemeProvider>
    );
    fireEvent.submit(screen.getByRole('textbox', { name: 'Valor' }));
    expect(on.onConfirm).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it('carregando não confirma de novo', () => {
    const on = wrap({ loading: true });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    expect(on.onConfirm).not.toHaveBeenCalled();
  });
});
