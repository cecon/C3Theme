// @vitest-environment jsdom
// Editor de fluxo pela spec (#72): lê o registro, monta os tipos da spec, grava o grafo no campo text com If-Match,
// barra fluxo com problema, avisa o registro que mudou e só olha sem permissão.
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { unstable_serialize } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, type C3Client } from '../../api';
import type { EntityDef } from '../../types';
import EntityFlow from './EntityFlow';
import { automacao, editor, fakeClient, mount, node, record, SAVED, VALID } from './flowFixture.test-utils';

vi.mock('@c3theme/flow', async () => ({ FlowEditor: (await import('./flowFixture.test-utils')).FakeEditor }));

afterEach(cleanup);

const flowPage = <EntityFlow entity="automacao" id="7" />;
const KEY = unstable_serialize(['c3-record', 'automacao', '7']);
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const change = (graph: Parameters<NonNullable<typeof editor.props.onChange>>[0]) => act(() => editor.props.onChange!(graph));

describe('EntityFlow', () => {
  it('abre o grafo gravado com os tipos da spec e grava no campo text com If-Match', async () => {
    const client = fakeClient(record());
    const cache = new Map<string, unknown>();
    mount(client, flowPage, { cache });
    expect(await screen.findByText('1 passos no editor')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Passos da automação' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pedido pelo WhatsApp' }).getAttribute('href')).toBe('/automacao/7');
    const { kinds } = editor.props;
    expect(kinds.map((k) => k.type)).toEqual(['gatilho', 'fim']);
    expect((kinds[0].icon as ReactElement<{ variant: string }>).props.variant).toBe('Bold');
    expect(kinds[1].icon).toBeUndefined();
    expect(editor.props.minimap).toBe(true);
    expect(button('Salvar').disabled).toBe(true);
    expect(button('Descartar').disabled).toBe(true);

    change(VALID);
    expect(await screen.findByText('2 passos no editor')).toBeTruthy();
    expect(button('Descartar').disabled).toBe(false);
    fireEvent.click(button('Salvar'));
    // gravando: os dois botões param até a resposta
    expect(button('Salvar').disabled).toBe(true);
    expect(button('Descartar').disabled).toBe(true);
    await waitFor(() => expect(client.update).toHaveBeenCalledWith('automacao', '7', { grafo: JSON.stringify(VALID) }, { ifMatch: 'v1' }));
    await waitFor(() => expect(button('Salvar').disabled).toBe(true));
    // o formulário lê a mesma chave: já fica com o grafo novo, sem ler de novo
    expect((cache.get(KEY) as { data: { grafo: string } }).data.grafo).toBe(JSON.stringify(VALID));
    expect(client.get).toHaveBeenCalledTimes(1);

    // a segunda gravação vai com a versão que a primeira devolveu
    const renamed = { ...VALID, nodes: VALID.nodes.map((n) => ({ ...n, label: 'Novo' })) };
    change(renamed);
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(client.update).toHaveBeenLastCalledWith('automacao', '7', { grafo: JSON.stringify(renamed) }, { ifMatch: 'v2' })
    );
  });

  it('com o registro já no cache, abre sem esperar o servidor', async () => {
    const client = { get: vi.fn(() => new Promise(() => {})) } as unknown as C3Client;
    const cache = new Map<string, unknown>([[KEY, { data: record(JSON.stringify(VALID)) }]]);
    mount(client, flowPage, { cache });
    expect(await screen.findByText('2 passos no editor')).toBeTruthy();
  });

  it('Descartar volta ao que está gravado; com mudança, fechar a aba pede confirmação', async () => {
    mount(fakeClient(record()), flowPage);
    await screen.findByText('1 passos no editor');
    const leave = () => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(leave()).toBe(false);
    change(VALID);
    await screen.findByText('2 passos no editor');
    expect(leave()).toBe(true);
    fireEvent.click(button('Descartar'));
    expect(await screen.findByText('1 passos no editor')).toBeTruthy();
    expect(leave()).toBe(false);
  });

  it('fluxo com problema não grava e diz quantos são', async () => {
    const client = fakeClient(record(''));
    mount(client, flowPage);
    await screen.findByText('0 passos no editor');
    change({ nodes: [node('a', 'gatilho')], edges: [] });
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Corrija o problema do fluxo antes de salvar.')).toBeTruthy();
    change({ nodes: [node('a', 'gatilho'), node('b', 'gatilho')], edges: [] });
    expect(screen.queryByText(/Corrija/)).toBeNull();
    fireEvent.click(button('Salvar'));
    expect(await screen.findByText('Corrija os 2 problemas do fluxo antes de salvar.')).toBeTruthy();
    expect(client.update).not.toHaveBeenCalled();
  });

  it('registro que mudou em outra sessão: avisa e Recarregar traz o gravado e a versão nova', async () => {
    const client = fakeClient(record(), async () => {
      throw new ApiError(412, 'stale', 'mudou');
    });
    const cache = new Map<string, unknown>();
    mount(client, flowPage, { cache });
    await screen.findByText('1 passos no editor');
    change(VALID);
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    const alert = (await screen.findByText(/Outra pessoa alterou este registro/)).closest('[role="alert"]')!;
    expect(alert.className).toContain('Warning');
    client.get.mockResolvedValueOnce({ ...record(JSON.stringify(VALID)), _version: 'v9' });
    fireEvent.click(button('Recarregar'));
    expect(await screen.findByText('2 passos no editor')).toBeTruthy();
    expect(screen.queryByText(/Outra pessoa/)).toBeNull();
    expect(button('Salvar').disabled).toBe(true);
    expect((cache.get(KEY) as { data: { _version: string } }).data._version).toBe('v9');
    change({ ...VALID, nodes: VALID.nodes.map((n) => ({ ...n, label: 'x' })) });
    fireEvent.click(button('Salvar'));
    await waitFor(() => expect(client.update).toHaveBeenLastCalledWith('automacao', '7', expect.anything(), { ifMatch: 'v9' }));
  });

  it('outro erro aparece como veio e some quando a gravação seguinte dá certo; sem _version, grava sem If-Match', async () => {
    const client = fakeClient({ ...record(), _version: undefined });
    client.update.mockRejectedValueOnce(new ApiError(422, 'invalid', 'Grafo grande demais')).mockRejectedValueOnce('caiu a rede');
    mount(client, flowPage);
    await screen.findByText('1 passos no editor');
    change(VALID);
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    const alert = (await screen.findByText('Grafo grande demais')).closest('[role="alert"]')!;
    expect(alert.className).toContain('Error');
    expect(client.update).toHaveBeenCalledWith('automacao', '7', { grafo: JSON.stringify(VALID) }, undefined);
    expect(screen.queryByRole('button', { name: 'Recarregar' })).toBeNull();
    fireEvent.click(button('Salvar'));
    expect(await screen.findByText('Erro ao salvar o fluxo.')).toBeTruthy();
    fireEvent.click(button('Salvar'));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('sem permissão, campo travado ou fora do que o usuário vê: só olha, sem Salvar', async () => {
    const lock = (extra: object) => ({ ...automacao, fields: [automacao.fields[0], { ...automacao.fields[1], ...extra }] }) as EntityDef;
    const cases = [
      { update: false },
      { def: lock({ denied: 'readOnly' }) },
      { def: lock({ readOnly: true }) },
      { def: { ...automacao, fields: [automacao.fields[0]] } as EntityDef }
    ];
    for (const opts of cases) {
      mount(fakeClient(record()), flowPage, opts);
      expect(await screen.findByText('Você pode ver o fluxo, mas não tem permissão para alterar.')).toBeTruthy();
      expect(editor.props.onChange).toBeUndefined();
      expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
      cleanup();
    }
  });

  it('JSON quebrado no campo, erro de leitura, entidade sem views e entidade fora do app', async () => {
    mount(fakeClient(record('{')), flowPage);
    expect(await screen.findByText("O campo 'grafo' não tem um fluxo válido (JSON com nodes e edges).")).toBeTruthy();
    cleanup();

    const failing = { get: vi.fn(async () => Promise.reject(new Error('caiu'))) } as unknown as C3Client;
    mount(failing, flowPage);
    expect(await screen.findByText('caiu')).toBeTruthy();
    cleanup();

    const plain = { ...automacao, views: undefined } as unknown as EntityDef;
    const client = fakeClient(record());
    mount(client, flowPage, { def: plain });
    expect(screen.getByText("A entidade 'automacao' não declara views.flow.")).toBeTruthy();
    expect(client.get).not.toHaveBeenCalled();
    cleanup();

    mount(fakeClient(record()), <EntityFlow entity="nada" id="7" />);
    expect(screen.getByText("A entidade 'nada' não declara views.flow.")).toBeTruthy();
  });

  it('sem titleField nem string, o link volta com o nome da entidade; title padrão é Fluxo', async () => {
    const def = {
      ...automacao,
      titleField: undefined,
      fields: [automacao.fields[1]],
      views: { flow: { ...automacao.views!.flow!, title: undefined, minimap: false } }
    } as unknown as EntityDef;
    mount(fakeClient(record()), flowPage, { def });
    expect(await screen.findByRole('link', { name: 'Automação' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Fluxo' })).toBeTruthy();
    expect(editor.props.minimap).toBe(false);
  });

  it('o grafo gravado é a base do Salvar: sem mudança real, continua desligado', async () => {
    mount(fakeClient(record(JSON.stringify(SAVED))), flowPage);
    await screen.findByText('1 passos no editor');
    change(JSON.parse(JSON.stringify(SAVED)));
    expect(button('Salvar').disabled).toBe(true);
  });
});
