// @vitest-environment jsdom
// Um estado declarado na tela (#99, #101): texto, como conceder, ação, o que continua e "Tentar de novo".
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StateView, { type StateViewProps } from './StateView';

afterEach(cleanup);

const view = (props: StateViewProps) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <MemoryRouter>
          <StateView {...props} />
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );

describe('StateView', () => {
  it('estado não declarado não desenha nada', () => {
    const { container } = view({ states: { empty: { text: 'Vazio' } }, state: 'error' });
    expect(container.textContent).toBe('');
  });

  it('carregando anuncia o texto como status', () => {
    view({ states: { loading: { text: { id: 'x.loading', defaultMessage: 'Abrindo' } } }, state: 'loading' });
    expect(screen.getByRole('status').textContent).toContain('Abrindo');
  });

  it('erro sem onRetry não tem botão; com onRetry usa o rótulo padrão', () => {
    const states = { error: { text: 'Falhou' } };
    view({ states, state: 'error' });
    expect(screen.queryByRole('button')).toBeNull();
    cleanup();
    const onRetry = vi.fn();
    view({ states, state: 'error', onRetry });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('o vazio não tem "Tentar de novo" e leva à ação da spec', () => {
    view({ states: { empty: { text: 'Vazio', action: { label: 'Criar', path: '/novo' } } }, state: 'empty', onRetry: () => {} });
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Criar' }).getAttribute('href')).toBe('/novo');
  });

  it('sem permissão mostra como conceder; offline lista o que continua', () => {
    view({ states: { forbidden: { text: 'Negado', howTo: 'Peça ao admin' } }, state: 'forbidden' });
    expect(screen.getByText('Peça ao admin')).toBeTruthy();
    cleanup();
    view({ states: { offline: { text: 'Sem rede', keeps: ['Ler', 'Copiar'] } }, state: 'offline', dense: true });
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Ler', 'Copiar']);
  });
});
