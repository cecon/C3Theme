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

  it('faixa: offline avisa, erro é erro e o resto informa, cada um com o seu ícone', () => {
    const states = { offline: { text: 'Sem rede' }, error: { text: 'Falhou' }, empty: { text: 'Vazio' } };
    const severity = (state: 'offline' | 'error' | 'empty') => {
      view({ states, state, banner: true });
      const alert = screen.getByRole('alert');
      const cls = alert.className;
      const icon = alert.querySelector('.MuiAlert-icon svg');
      cleanup();
      return [cls.match(/MuiAlert-color(\w+)/)?.[1], !!icon];
    };
    expect(severity('offline')).toEqual(['Warning', true]);
    expect(severity('error')).toEqual(['Error', true]);
    expect(severity('empty')[0]).toBe('Info');
  });

  it('faixa de erro: "Tentar de novo" discreto, com o texto de apoio abaixo do título', () => {
    const onRetry = vi.fn();
    view({ states: { offline: { text: 'Sem rede', keeps: ['Ler'] } }, state: 'offline', banner: true });
    expect(screen.getByRole('alert').textContent).toBe('Sem redeLer');
    cleanup();
    view({ states: { error: { text: 'Falhou', retry: 'De novo' } }, state: 'error', banner: true, onRetry });
    const button = screen.getByRole('button', { name: 'De novo' });
    expect(button.className).toContain('MuiButton-text');
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalled();
  });

  it('o que continua sem como conceder fica colado ao título; sem lista, nada de lista', () => {
    view({ states: { offline: { text: 'Sem rede', keeps: [] } }, state: 'offline' });
    expect(screen.queryByRole('list')).toBeNull();
    expect(document.querySelector('svg')).toBeTruthy();
    cleanup();
    view({
      states: { forbidden: { text: 'Negado', howTo: 'Peça', action: { label: 'Pedir', href: 'https://x.dev/' } } },
      state: 'forbidden'
    });
    expect(screen.getByRole('link', { name: 'Pedir' }).getAttribute('href')).toBe('https://x.dev/');
    expect(screen.queryByRole('list')).toBeNull();
  });
});
