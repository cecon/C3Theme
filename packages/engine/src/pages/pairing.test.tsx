// @vitest-environment jsdom
// Seção de ligar aparelho (#6): o DeviceLink sai dos campos do registro e os botões rodam ações de registro.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef, WireRecord } from '../types';
import EntityForm from './EntityForm';

afterEach(cleanup);

const numero: EntityDef = {
  name: 'numero',
  label: { singular: 'Número', plural: 'Números' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    {
      name: 'situacao',
      type: 'enum',
      label: 'Situação',
      options: ['desligado', 'conectando', 'qr', 'codigo', 'conectado', 'erro'].map((v) => ({ value: v, label: v }))
    },
    { name: 'qr', type: 'string', label: 'QR' },
    { name: 'codigo', type: 'string', label: 'Código' },
    { name: 'mensagem', type: 'string', label: 'Mensagem' }
  ],
  actions: [
    { name: 'ligar', label: 'Ligar' },
    { name: 'ligar_codigo', label: 'Ligar com código', input: { fields: [{ name: 'telefone', type: 'string', label: 'Telefone' }] } },
    { name: 'desligar', label: 'Desligar', visibleWhen: { field: 'situacao', op: 'ne', value: 'desligado' } }
  ],
  views: {
    form: {
      sections: [
        { rows: [['nome']] },
        {
          title: 'Conexão',
          pairing: {
            status: 'situacao',
            qr: 'qr',
            code: 'codigo',
            error: 'mensagem',
            states: { conectando: 'connecting', qr: 'qr', codigo: 'pairing-code', conectado: 'connected', erro: 'error' },
            actions: { qr: 'ligar', code: 'ligar_codigo', cancel: 'desligar', retry: 'ligar' }
          }
        }
      ]
    }
  }
};

function setup(row: WireRecord, actions: Record<string, boolean> = { ligar: true, ligar_codigo: true, desligar: true }) {
  const caps: Capabilities = { list: true, read: true, create: true, update: true, delete: false, actions };
  const action = vi.fn().mockResolvedValue({ data: row });
  const value = {
    client: { get: vi.fn().mockResolvedValue(row), action } as unknown as C3Client,
    app: { name: 'demo' } as never,
    entities: { numero: { def: numero, capabilities: caps } },
    components: {}
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <MemoryRouter>
            <EngineProvider value={value}>
              <EntityForm entity="numero" id="7" />
            </EngineProvider>
          </MemoryRouter>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  return action;
}

const base = { id: '7', nome: 'Loja', qr: null, codigo: null, mensagem: null };

describe('seção de ligar aparelho', () => {
  it('QR do registro; usar código pede o número e roda a ação com ele; cancelar roda a sua', async () => {
    const action = setup({ ...base, situacao: 'qr', qr: '2@abc' });
    expect(await screen.findByRole('img', { name: 'QR Code para ligar o aparelho' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(action).toHaveBeenCalledWith('numero', '7', 'desligar', undefined));
    fireEvent.click(screen.getByRole('button', { name: 'Usar código em vez de QR' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Número do celular/ }), { target: { value: '5511987654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pedir código' }));
    await waitFor(() => expect(action).toHaveBeenCalledWith('numero', '7', 'ligar_codigo', { telefone: '5511987654321' }));
  });

  it('código de pareamento e erro saem dos campos; sem permissão, sem botão', async () => {
    setup({ ...base, situacao: 'erro', mensagem: 'Sessão recusada' }, { ligar: false });
    expect(await screen.findByText('Sessão recusada')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
    cleanup();
    setup({ ...base, situacao: 'codigo', codigo: 'ABCD1234' });
    expect(await screen.findByText('Digite este código no celular')).toBeTruthy();
  });

  it('situação fora de states esconde a seção', async () => {
    setup({ ...base, situacao: 'desligado' });
    await screen.findByDisplayValue('Loja');
    expect(screen.queryByText('Conexão')).toBeNull();
  });
});
