// @vitest-environment jsdom
// Vitrine pelo motor (#13): lista em cartões, ação de registro no cartão, visualizador e cabeçalho com imagem.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import type { Capabilities, EntityDef } from '../../types';
import EntityForm from '../EntityForm';
import EntityList from '../EntityList';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false, actions: { instalar: true } };
const item: EntityDef = {
  name: 'item',
  label: { singular: 'Item', plural: 'Itens' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    { name: 'resumo', type: 'string', label: 'Resumo' },
    { name: 'autor', type: 'string', label: 'Autor' },
    { name: 'foto', type: 'string', label: 'Foto' },
    { name: 'tipo', type: 'enum', label: 'Tipo', options: [{ value: 'app', label: 'App', color: 'info' }] },
    { name: 'instalado', type: 'boolean', label: 'Instalado' }
  ],
  actions: [{ name: 'instalar', label: 'Instalar', visibleWhen: { field: 'instalado', op: 'eq', value: false } }],
  views: {
    list: { rowActions: [{ action: 'instalar' }] },
    gallery: { image: 'foto', subtitle: 'resumo', caption: ['autor'], chip: 'tipo', viewer: true },
    form: {
      header: { image: { component: 'rosto' }, subtitle: 'resumo', caption: ['autor', 'tipo'] },
      sections: [{ rows: [[{ field: 'nome' }, { field: 'resumo' }]] }]
    }
  }
};
const rows = [
  { id: '1', nome: 'Agenda', resumo: 'Marca horários', autor: 'Ana', foto: 'https://x/1.png', tipo: 'app', instalado: false },
  { id: '2', nome: 'Caixa', resumo: 'Fecha o caixa', autor: 'Bia', foto: null, tipo: 'app', instalado: true }
];

function setup(ui: ReactNode, client: Partial<C3Client>) {
  const value = {
    client: client as C3Client,
    app: { name: 'demo' } as never,
    entities: { item: { def: item, capabilities: ALL } },
    components: { rosto: ({ record }: { record: { nome: string } }) => <span>rosto de {record.nome}</span> } as never
  };
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={value}>
            <MemoryRouter>
              <Routes>
                <Route path="/" element={ui} />
                <Route path="/item/:id" element={<p>página do registro</p>} />
              </Routes>
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('galeria', () => {
  it('cartões com título, linhas, chip e o botão da ação só onde ela vale', async () => {
    const action = vi.fn().mockResolvedValue({ data: { ...rows[0], instalado: true } });
    setup(<EntityList entity="item" view="gallery" />, { list: vi.fn().mockResolvedValue({ data: rows, meta: { total: 2 } }), action });
    expect(await screen.findByText('Agenda')).toBeTruthy();
    expect(screen.getByText('Marca horários')).toBeTruthy();
    expect(screen.getByText('Bia')).toBeTruthy();
    expect(screen.getAllByText('App')).toHaveLength(2);
    const buttons = screen.getAllByRole('button', { name: 'Instalar' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(action).toHaveBeenCalledWith('item', '1', 'instalar', undefined));
    fireEvent.click(screen.getByText('Caixa'));
    expect(await screen.findByText('página do registro')).toBeTruthy();
  });

  it('a imagem abre o visualizador, com próxima e Esc', async () => {
    setup(<EntityList entity="item" view="gallery" />, { list: vi.fn().mockResolvedValue({ data: rows, meta: { total: 2 } }) });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver imagem de Agenda' }));
    expect(screen.getByRole('dialog', { name: 'Agenda' })).toBeTruthy();
    expect(screen.getByText('Agenda · 1 de 1')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('cabeçalho do registro com o rosto registrado e as linhas', async () => {
    setup(<EntityForm entity="item" id="1" />, { get: vi.fn().mockResolvedValue(rows[0]) });
    expect(await screen.findByText('rosto de Agenda')).toBeTruthy();
    expect(screen.getByText('Ana · App')).toBeTruthy();
    expect(screen.getAllByText('Marca horários').length).toBeGreaterThan(0);
  });
});
