// @vitest-environment jsdom
// Configuração que vale na hora (#160): switch grava sem clique extra, texto ao sair, erro volta o valor.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, type C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef } from '../types';
import AutosaveForm from './AutosaveForm';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false };
const avisos: EntityDef = {
  name: 'avisos_ajustes',
  label: { singular: 'Notificações', plural: 'Notificações' },
  singleton: true,
  fields: [
    { name: 'silencio_de', type: 'string', label: 'De', required: true, visibleWhen: { field: 'silencio', op: 'eq', value: true } },
    { name: 'silencio', type: 'boolean', label: 'Horário de silêncio', help: 'Não avisa à noite' },
    { name: 'som', type: 'boolean', label: 'Tocar som' },
    { name: 'versao', type: 'string', label: 'Versão', readOnly: true }
  ],
  views: { form: { autosave: true, sections: [{ title: 'Avisos', rows: [['som'], ['silencio'], ['silencio_de'], ['versao']] }] } }
};

function setup(client: Partial<C3Client>) {
  const value = {
    client: client as C3Client,
    app: { name: 'demo' } as never,
    entities: { avisos_ajustes: { def: avisos, capabilities: ALL } },
    components: {}
  };
  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={value}>
            <MemoryRouter>
              <AutosaveForm entity="avisos_ajustes" id="1" />
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

const row = { id: '1', som: true, silencio: false, silencio_de: '22:00', versao: '1.4', _version: 'v0' };

describe('AutosaveForm', () => {
  it('abre editável com o label.singular no título e o switch grava na hora, com a versão', async () => {
    const update = vi.fn().mockResolvedValue({ ...row, som: false, _version: 'v1' });
    setup({ get: vi.fn().mockResolvedValue(row), update });
    expect(await screen.findByRole('heading', { name: 'Notificações' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Tocar som' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('avisos_ajustes', '1', { som: false }, { ifMatch: 'v0' }));
    expect(await screen.findByText('Salvo')).toBeTruthy();
  });

  it('visibleWhen vale na hora e o texto grava ao sair do campo', async () => {
    const update = vi
      .fn()
      .mockResolvedValueOnce({ ...row, silencio: true, _version: 'v1' })
      .mockResolvedValueOnce({ ...row, silencio: true, silencio_de: '23:00', _version: 'v2' });
    setup({ get: vi.fn().mockResolvedValue(row), update });
    await screen.findByRole('heading', { name: 'Notificações' });
    expect(screen.queryByRole('textbox', { name: /De/ })).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Horário de silêncio' }));
    const de = await screen.findByRole('textbox', { name: /De/ });
    fireEvent.change(de, { target: { value: '23:00' } });
    expect(update).toHaveBeenCalledTimes(1);
    fireEvent.blur(de);
    await waitFor(() => expect(update).toHaveBeenLastCalledWith('avisos_ajustes', '1', { silencio_de: '23:00' }, { ifMatch: 'v1' }));
  });

  it('erro de validação fica no campo e o valor volta ao gravado', async () => {
    const update = vi
      .fn()
      .mockRejectedValue(new ApiError(422, 'validation', 'inválido', { som: [{ code: 'x', message: 'Sem permissão de som' }] }));
    setup({ get: vi.fn().mockResolvedValue(row), update });
    const som = await screen.findByRole('switch', { name: 'Tocar som' });
    fireEvent.click(som);
    expect(await screen.findByText('Sem permissão de som')).toBeTruthy();
    expect((screen.getByRole('switch', { name: 'Tocar som' }) as HTMLInputElement).checked).toBe(true);
  });

  it('campo só de leitura aparece uma vez, na seção dele', async () => {
    setup({ get: vi.fn().mockResolvedValue(row), update: vi.fn() });
    await screen.findByRole('heading', { name: 'Notificações' });
    expect(screen.getAllByDisplayValue('1.4')).toHaveLength(1);
  });
});
