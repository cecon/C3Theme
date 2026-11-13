// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import C3ThemeProvider from '../../../ui/src/C3ThemeProvider';
import { EngineProvider, type EngineState } from '../context';
import SettingsModal from './SettingsModal';
import type { SettingsDef } from '../settingsTypes';
import type { SettingsPort } from './port';
import { ApiError } from '../apiError';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

it('403 no load mostra painel explicativo e erro comum permite reler', async () => {
  const view = mount(def, {
    load: async () => {
      throw new ApiError(403, 'forbidden', 'negado');
    }
  });
  expect(await screen.findByText('Você não tem permissão para ver esta seção.')).toBeTruthy();
  expect(screen.queryByRole('textbox', { name: 'Nome' })).toBeNull();
  view.unmount();
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('rede'))
    .mockResolvedValue({ values: { name: 'Recuperado' } });
  mount(def, { load });
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByRole('textbox', { name: 'Nome' })).toHaveProperty('value', 'Recuperado');
});
const def: SettingsDef = {
  title: 'Preferências',
  search: 'Buscar ajustes',
  initialSection: 'a',
  restoreSection: true,
  sections: [
    {
      id: 'a',
      title: 'Geral',
      rows: [
        { id: 'locked', title: 'Bloqueado', control: { type: 'switch', value: false, readOnly: true } },
        { id: 'name', title: 'Nome', control: { type: 'text', value: 'Ana', readOnly: false } }
      ]
    },
    {
      id: 'b',
      title: 'Voz',
      rows: [{ id: 'language', title: 'Idioma', control: { type: 'select', options: [{ value: 'pt', label: 'Português' }] } }]
    },
    { id: 'remote', title: 'Área remota', capability: 'remote', rows: [] }
  ]
};
function mount(config = def, port?: SettingsPort, extra: Partial<React.ComponentProps<typeof SettingsModal>> = {}) {
  const state = { client: {}, app: { name: 'Exemplo' }, entities: {}, components: {}, platform: 'desktop', pageAccess: {} } as EngineState;
  return render(
    <C3ThemeProvider>
      <EngineProvider value={state}>
        <SettingsModal def={config} port={port} open onClose={() => {}} {...extra} />
      </EngineProvider>
    </C3ThemeProvider>
  );
}
it('readOnly não grava; texto editável mantém rascunho entre abas e grava pela porta', async () => {
  const change = vi.fn(async () => {});
  mount(def, { load: async () => ({}), change });
  const locked = await screen.findByRole('switch', { name: 'Bloqueado' });
  expect(locked).toHaveProperty('disabled', true);
  fireEvent.click(locked);
  expect(change).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), { target: { value: 'Beatriz' } });
  await waitFor(() => expect(change).toHaveBeenCalledWith({ modal: 'personal', section: 'a', row: 'name', value: 'Beatriz' }));
  fireEvent.click(screen.getByRole('button', { name: 'Voz' }));
  fireEvent.click(screen.getByRole('button', { name: 'Geral' }));
  expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveProperty('value', 'Beatriz');
});
it('restaura seção, política pedida vence e servidores têm chaves independentes', async () => {
  const view = mount(def, undefined, { restoreKey: 'server-a' });
  fireEvent.click(screen.getByRole('button', { name: 'Voz' }));
  view.unmount();
  const restored = mount(def, undefined, { restoreKey: 'server-a' });
  expect(screen.getByRole('button', { name: 'Voz' }).getAttribute('aria-current')).toBe('page');
  restored.unmount();
  const other = mount(def, undefined, { restoreKey: 'server-b' });
  expect(screen.getByRole('button', { name: 'Geral' }).getAttribute('aria-current')).toBe('page');
  other.unmount();
  mount(def, undefined, { restoreKey: 'server-a', section: 'a' });
  expect(screen.getByRole('button', { name: 'Geral' }).getAttribute('aria-current')).toBe('page');
});
it('capacidade vem da porta; busca abre seção e foca combobox real da linha', async () => {
  mount(def, { load: async () => ({ capabilities: ['remote'] }) });
  expect(await screen.findByRole('button', { name: 'Área remota' })).toBeTruthy();
  const search = screen.getByRole('combobox', { name: 'Buscar ajustes' });
  fireEvent.change(search, { target: { value: 'Idioma' } });
  fireEvent.keyDown(search, { key: 'Enter' });
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Idioma' })));
  expect(screen.getByText('Idioma').closest('[data-settings-row]')?.getAttribute('data-highlighted')).toBe('true');
});
it('busca do servidor usa título/descrição de seção e não rótulos das linhas', async () => {
  mount(def, undefined, { scope: 'server' });
  const search = screen.getByRole('combobox', { name: 'Buscar ajustes' });
  fireEvent.change(search, { target: { value: 'Nome' } });
  expect(screen.getByText('Nenhuma configuração encontrada.')).toBeTruthy();
  fireEvent.change(search, { target: { value: 'Voz' } });
  fireEvent.keyDown(search, { key: 'Enter' });
  expect(screen.getByRole('button', { name: 'Voz' }).getAttribute('aria-current')).toBe('page');
});
it('falha de gravação preserva valor, exige confirmação e retry não relê nem perde alteração', async () => {
  const change = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValue(undefined);
  const load = vi.fn(async () => ({}));
  mount(def, { load, change });
  fireEvent.change(await screen.findByRole('textbox', { name: 'Nome' }), { target: { value: 'Beatriz' } });
  expect(await screen.findByText('Não foi possível salvar. Seus ajustes continuam aqui; tente de novo.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
  expect(screen.getByText('Descartar alterações?')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
  expect(await screen.findByRole('textbox', { name: 'Nome' })).toHaveProperty('value', 'Beatriz');
  await waitFor(() => expect(change).toHaveBeenCalledTimes(2));
  expect(load).toHaveBeenCalledTimes(1);
});
it('gravações são serializadas para uma resposta antiga não vencer a nova', async () => {
  let finish = () => {};
  const change = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValue(undefined);
  mount(def, { load: async () => ({}), change });
  const input = await screen.findByRole('textbox', { name: 'Nome' });
  fireEvent.change(input, { target: { value: 'B' } });
  fireEvent.change(input, { target: { value: 'Beatriz' } });
  await waitFor(() => expect(change).toHaveBeenCalledTimes(1));
  finish();
  await waitFor(() => expect(change).toHaveBeenCalledTimes(2));
  expect(change.mock.calls[1][0].value).toBe('Beatriz');
});
