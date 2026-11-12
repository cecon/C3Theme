// @vitest-environment jsdom
// #110: configurações em abas (na URL), busca que leva ao ajuste, confirmação antes do PATCH, aviso de reinício,
// seção por plataforma e campo de atalho que recusa o repetido.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { MemoryRouter, useLocation } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import type { Capabilities, ClientPlatform, EntityDef } from '../../types';
import AutosaveForm from '../AutosaveForm';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false };
const prefs: EntityDef = {
  name: 'prefs',
  label: { singular: 'Configurações', plural: 'Configurações' },
  singleton: true,
  fields: [
    {
      name: 'tema',
      type: 'enum',
      label: 'Aparência',
      keywords: ['escuro', 'modo'],
      options: [
        { value: 'claro', label: 'Claro' },
        { value: 'escuro', label: 'Escuro' }
      ]
    },
    {
      name: 'backup',
      type: 'boolean',
      label: 'Cópia de segurança',
      confirmChange: {
        message: 'Desligar a cópia?',
        effect: 'Nada será copiado.',
        confirmLabel: 'Desligar',
        when: { field: 'backup', op: 'eq', value: false }
      }
    },
    { name: 'pasta', type: 'string', label: 'Pasta dos dados', restart: true, confirmChange: { message: 'Trocar a pasta?' } },
    { name: 'gpu', type: 'boolean', label: 'Aceleração', restart: 'Feche e abra o app.' },
    { name: 'busca', type: 'string', format: 'shortcut', label: 'Abrir a busca' },
    { name: 'paleta', type: 'string', format: 'shortcut', label: 'Abrir a paleta' }
  ],
  views: {
    form: {
      autosave: true,
      search: true,
      sections: [
        { title: 'Visual', tab: 'Geral', rows: [['tema']] },
        { title: 'Dados', tab: 'Geral', rows: [['backup'], ['pasta']] },
        { title: 'Desempenho', tab: 'Avançado', platforms: ['desktop'], rows: [['gpu']] },
        { title: 'Teclado', tab: 'Atalhos', rows: [['busca'], ['paleta']] }
      ]
    }
  }
};
const row = { id: '1', tema: 'claro', backup: true, pasta: '/dados', gpu: false, busca: 'Ctrl+K', paleta: null, _version: 'v0' };

function Where() {
  return <output aria-label="endereço">{useLocation().search}</output>;
}

function setup(
  update = vi.fn(async (_e: string, _i: string, body: object) => ({ ...row, ...body })),
  platform?: ClientPlatform,
  route = '/'
) {
  const client = { get: vi.fn().mockResolvedValue(row), update } as unknown as C3Client;
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider
            value={{
              client,
              app: { name: 'x' } as never,
              entities: { prefs: { def: prefs, capabilities: ALL } },
              components: {},
              platform
            }}
          >
            <MemoryRouter initialEntries={[route]}>
              <AutosaveForm entity="prefs" id="1" />
              <Where />
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  return update;
}

describe('configurações em abas (#110)', () => {
  it('as seções viram abas, a aberta vai para a URL e a aba de outra plataforma some', async () => {
    setup(undefined, 'web');
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Geral', 'Atalhos']);
    expect(screen.getByRole('combobox', { name: 'Aparência' })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Atalhos' }));
    expect(screen.getByLabelText('endereço').textContent).toBe('?tab=Atalhos');
    expect(screen.queryByRole('combobox', { name: 'Aparência' })).toBeNull();
    expect(screen.getByRole('tabpanel', { name: 'Atalhos' })).toBeTruthy();
  });

  it('abre na aba da URL; no desktop a aba da plataforma aparece', async () => {
    setup(undefined, 'desktop', '/?tab=Avan%C3%A7ado');
    expect(await screen.findByRole('switch', { name: 'Aceleração' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('a busca acha pelo sinônimo, sem acento, abre a aba e destaca a linha', async () => {
    setup(undefined, 'web', '/?tab=Atalhos');
    const box = await screen.findByRole('combobox', { name: 'Buscar nas configurações' });
    fireEvent.mouseDown(box);
    fireEvent.change(box, { target: { value: 'ESCURO' } });
    const option = await screen.findByRole('option', { name: /Aparência/ });
    expect(option.textContent).toBe('Aparência · Geral');
    fireEvent.click(option);
    expect(screen.getByLabelText('endereço').textContent).toBe('?tab=Geral');
    await waitFor(() => expect(document.querySelector('[data-setting="tema"]')).toBeTruthy());
    fireEvent.change(box, { target: { value: 'nada disso' } });
    expect(await screen.findByText('Nenhum ajuste encontrado.')).toBeTruthy();
  });

  it('switch com confirmação: Cancelar não grava; Confirmar grava; ligar não pergunta', async () => {
    const update = setup(undefined, 'web');
    const sw = await screen.findByRole('switch', { name: 'Cópia de segurança' });
    fireEvent.click(sw);
    const dialog = await screen.findByRole('dialog', { name: 'Desligar a cópia?' });
    expect(within(dialog).getByText('Nada será copiado.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(update).not.toHaveBeenCalled();
    expect((sw as HTMLInputElement).checked).toBe(true);

    fireEvent.click(sw);
    fireEvent.click(await screen.findByRole('button', { name: 'Desligar' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('prefs', '1', { backup: false }, { ifMatch: 'v0' }));
  });

  it('texto com confirmação pergunta ao sair; Cancelar volta o digitado; depois de gravar avisa o reinício', async () => {
    const update = setup(undefined, 'web');
    const input = (await screen.findByRole('textbox', { name: 'Pasta dos dados' })) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '/novo' } });
    fireEvent.blur(input);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(input.value).toBe('/dados'));
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '/novo' } });
    fireEvent.blur(input);
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('prefs', '1', { pasta: '/novo' }, { ifMatch: 'v0' }));
    expect(await screen.findByText('Reinicie o app para aplicar esta mudança.')).toBeTruthy();
  });

  it('aviso de reinício com o texto do campo', async () => {
    setup(undefined, 'desktop', '/?tab=Avan%C3%A7ado');
    fireEvent.click(await screen.findByRole('switch', { name: 'Aceleração' }));
    expect(await screen.findByText('Feche e abra o app.')).toBeTruthy();
  });

  it('o atalho captura a combinação e recusa o que outro campo já usa', async () => {
    const update = setup(undefined, 'web', '/?tab=Atalhos');
    const paleta = await screen.findByRole('textbox', { name: 'Abrir a paleta' });
    fireEvent.keyDown(paleta, { key: 'k', code: 'KeyK', ctrlKey: true });
    expect(await screen.findByText('Ctrl+K já é o atalho de Abrir a busca.')).toBeTruthy();
    fireEvent.keyDown(paleta, { key: 'Control', code: 'ControlLeft', ctrlKey: true });
    fireEvent.keyDown(paleta, { key: 'P', code: 'KeyP', ctrlKey: true, shiftKey: true });
    expect((paleta as HTMLInputElement).value).toBe('Ctrl+Shift+P');
    await act(async () => fireEvent.blur(paleta));
    await waitFor(() => expect(update).toHaveBeenCalledWith('prefs', '1', { paleta: 'Ctrl+Shift+P' }, { ifMatch: 'v0' }));
    fireEvent.keyDown(paleta, { key: 'Backspace', code: 'Backspace' });
    expect((paleta as HTMLInputElement).value).toBe('');
  });
});
