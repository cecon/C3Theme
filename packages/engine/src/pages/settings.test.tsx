// @vitest-environment jsdom
// Configuração que vale na hora (#160): switch grava sem clique extra, texto ao sair, erro volta o valor.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef } from '../types';
import { MemoryRouter, useLocation } from 'react-router';
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

function Location() {
  return <output aria-label="URL">{useLocation().search}</output>;
}
function setup(client: Partial<C3Client>, def: EntityDef = avisos, platform: 'web' | 'desktop' | 'mobile' = 'web') {
  const value = {
    client: client as C3Client,
    app: { name: 'demo' } as never,
    entities: { avisos_ajustes: { def, capabilities: ALL } },
    platform,
    components: {}
  };
  return render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={value}>
            <MemoryRouter initialEntries={['/?tab=Security&keep=yes']}>
              <Location />
              <AutosaveForm entity="avisos_ajustes" id="1" />
            </MemoryRouter>
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
}

const row = { id: '1', som: true, silencio: false, silencio_de: '22:00', versao: '1.4', _version: 'v0' };

const def: EntityDef = {
  ...avisos,
  fields: [
    {
      name: 'som',
      type: 'boolean',
      label: 'Permitir acesso',
      confirmChange: { question: 'Permitir acesso remoto?', effect: 'Outros aparelhos poderao conectar.' },
      restartNotice: 'Reinicie o app para aplicar.'
    },
    { name: 'atalho', type: 'string', label: 'Abrir chat', component: 'shortcut', keywords: ['conversa'] },
    { name: 'outro', type: 'string', label: 'Outra acao', component: 'shortcut' },
    { name: 'desktop', type: 'string', label: 'Desktop only' }
  ],
  views: {
    form: {
      autosave: true,
      sections: [
        { tab: 'Geral', rows: [['atalho'], ['outro']] },
        { tab: 'Security', rows: [['som']] },
        { tab: 'Desktop', platforms: ['desktop'], rows: [['desktop']] }
      ]
    }
  }
};
describe('Settings complete', () => {
  it('abre a aba da URL, confirma antes de gravar, cancelar reverte e restart so apos sucesso', async () => {
    const update = vi.fn().mockResolvedValue({ ...row, som: false, _version: 'v1' });
    setup({ get: vi.fn().mockResolvedValue(row), update }, def);
    const toggle = await screen.findByRole('switch', { name: 'Permitir acesso' });
    expect(screen.queryByRole('tab', { name: 'Desktop' })).toBeNull();
    expect(screen.queryByText('Reinicie o app para aplicar.')).toBeNull();
    fireEvent.click(toggle);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect((screen.getByRole('switch', { name: 'Permitir acesso' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('switch', { name: 'Permitir acesso' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('Reinicie o app para aplicar.')).toBeTruthy();
    expect(update).toHaveBeenCalledWith('avisos_ajustes', '1', { som: false }, { ifMatch: 'v0' });
  });
  it('busca por sinonimo abre aba e captura combinacao, recusando duplicacao', async () => {
    const loaded = { ...row, atalho: 'Ctrl+K', outro: 'Ctrl+J' };
    const update = vi.fn().mockResolvedValue({ ...loaded, atalho: 'Ctrl+Shift+P', _version: 'v1' });
    setup({ get: vi.fn().mockResolvedValue(loaded), update }, def);
    fireEvent.change(await screen.findByRole('textbox', { name: /Buscar nas/ }), { target: { value: 'conversa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir chat' }));
    const input = screen.getByRole('textbox', { name: 'Abrir chat' });
    expect(input.closest('[data-setting]')?.getAttribute('data-setting')).toBe('atalho');
    fireEvent.keyDown(input, { key: 'j', ctrlKey: true });
    expect(await screen.findByText(/Este atalho/)).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'p', ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(update).toHaveBeenCalledWith('avisos_ajustes', '1', { atalho: 'Ctrl+Shift+P' }, { ifMatch: 'v0' }));
  });
  it('nao avisa restart quando PATCH falha', async () => {
    setup({ get: vi.fn().mockResolvedValue(row), update: vi.fn().mockRejectedValue(new Error('Falhou')) }, def);
    fireEvent.click(await screen.findByRole('switch', { name: 'Permitir acesso' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText('Falhou')).toBeTruthy();
    expect(screen.queryByText('Reinicie o app para aplicar.')).toBeNull();
  });
  it('guarda aba na URL, mantém outros parâmetros e filtra plataforma e busca sem resultados', async () => {
    setup({ get: vi.fn().mockResolvedValue(row) }, def, 'desktop');
    fireEvent.click(await screen.findByRole('tab', { name: 'Desktop' }));
    expect(screen.getByLabelText('URL').textContent).toBe('?tab=Desktop&keep=yes');
    expect(screen.getByRole('textbox', { name: 'Desktop only' })).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: /Buscar nas/ }), { target: { value: 'unknown' } });
    expect(screen.getByText('Nenhuma configuração encontrada.')).toBeTruthy();
  });
  it('atalho mantém Tab/Escape e aceita limpar, sem permitir texto comum', async () => {
    const update = vi.fn().mockResolvedValue({ ...row, atalho: '', _version: 'v1' });
    setup({ get: vi.fn().mockResolvedValue({ ...row, atalho: 'Ctrl+K' }), update }, def);
    fireEvent.click(await screen.findByRole('tab', { name: 'Geral' }));
    const input = screen.getByRole('textbox', { name: 'Abrir chat' });
    for (const key of ['Tab', 'Escape', 'Control', 'x']) fireEvent.keyDown(input, { key });
    expect(update).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Delete' });
    await waitFor(() => expect(update).toHaveBeenCalledWith('avisos_ajustes', '1', { atalho: '' }, { ifMatch: 'v0' }));
  });
});
