// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, describe, expect, it } from 'vitest';

import { EngineProvider, type EngineState } from '../../context';
import type { EntityDef } from '../../types';
import { RowPreview } from './RowPreview';

afterEach(cleanup);

const cliente = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  fields: [
    { name: 'telefone', type: 'string', label: 'Telefone', format: 'phone' },
    { name: 'pedidos', type: 'integer', label: 'Pedidos' },
    { name: 'sobre', type: 'text', label: 'Sobre' },
    {
      name: 'interesses',
      type: 'flags',
      label: 'Interesses',
      options: [
        { value: 'vinho', label: 'Vinhos' },
        { value: 'cafe', label: 'Cafés' }
      ]
    }
  ]
} as unknown as EntityDef;

const Call = () => <svg data-testid="icone-call" />;

function setup(row: Record<string, unknown>) {
  const engine = { entities: {}, components: {}, icons: { Call } } as unknown as EngineState;
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={engine}>
          <RowPreview
            def={cliente}
            row={{ id: '1', ...row }}
            expand={{
              fields: [{ field: 'telefone', icon: 'Call' }],
              stats: ['pedidos'],
              notes: [{ field: 'sobre', label: 'Observações' }, 'interesses']
            }}
          />
        </EngineProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('prévia da linha', () => {
  it('mostra dado com ícone, número em destaque, texto com título e flags como etiquetas', () => {
    setup({ telefone: '11981234567', pedidos: 12, sobre: 'Cliente antigo.', interesses: ['cafe'] });
    expect(screen.getByTestId('icone-call')).toBeTruthy();
    expect(screen.getByText('(11) 98123-4567')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Observações')).toBeTruthy();
    expect(screen.getByText('Cliente antigo.')).toBeTruthy();
    expect(screen.getByText('Cafés')).toBeTruthy();
  });

  it('valor vazio vira traço e flags vazio some', () => {
    setup({ telefone: null, pedidos: 0, sobre: null, interesses: [] });
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByLabelText('Interesses')).toBeNull();
  });
});
