// @vitest-environment jsdom
// Editor de fluxo pela spec (#72): lê o registro, monta os tipos da spec, grava o grafo no campo text com If-Match,
// barra fluxo com problema, avisa o registro que mudou, só olha sem permissão; e o campo no formulário.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FlowEditorProps, FlowGraph } from '@c3theme/flow';

import { ApiError, type C3Client } from '../../api';
import { EngineProvider } from '../../context';
import type { EntityDef, WireRecord } from '../../types';
import FieldInput from '../../widgets/FieldInput';
import EntityFlow from './EntityFlow';

// o canvas de verdade (React Flow) não roda no jsdom: o editor de mentira mostra o que recebeu e muda o grafo
let editor: FlowEditorProps;
vi.mock('@c3theme/flow', () => ({
  FlowEditor: (props: FlowEditorProps) => {
    editor = props;
    return <p>{`${props.value.nodes.length} passos no editor`}</p>;
  }
}));

afterEach(cleanup);

const automacao = {
  name: 'automacao',
  label: { singular: 'Automação', plural: 'Automações' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    { name: 'grafo', type: 'text', label: 'Passos' }
  ],
  views: {
    flow: {
      field: 'grafo',
      title: 'Passos da automação',
      kinds: [
        { type: 'gatilho', label: 'Gatilho', icon: 'Flash', input: false },
        { type: 'fim', label: 'Fim', outputs: [] }
      ]
    }
  }
} as unknown as EntityDef;

const node = (id: string, type: string) => ({ id, type, position: { x: 0, y: 0 } });
const VALID: FlowGraph = {
  nodes: [node('a', 'gatilho'), node('b', 'fim')],
  edges: [{ id: 'e', source: 'a', sourcePort: 'out', target: 'b' }]
};
const SAVED = { nodes: [node('a', 'gatilho')], edges: [] };

function fakeClient(record: WireRecord, update?: C3Client['update']) {
  return {
    get: vi.fn(async () => record),
    update: vi.fn(update ?? (async (_e: string, _id: string, patch: WireRecord) => ({ ...record, ...patch, _version: 'v2' })))
  } as unknown as C3Client & { get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
}

function mount(client: C3Client, ui: ReactNode, opts: { def?: EntityDef; update?: boolean; path?: string } = {}) {
  const def = opts.def ?? automacao;
  const value = {
    client,
    app: { name: 'x', entities: ['automacao'], layout: { menu: [] } },
    entities: { automacao: { def, capabilities: { read: true, update: opts.update ?? true } } },
    components: {},
    icons: { Flash: () => <svg /> }
  } as never;
  render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <SWRConfig value={{ provider: () => new Map() }}>
        <EngineProvider value={value}>
          <MemoryRouter initialEntries={[opts.path ?? '/automacao/7/flow']}>
            <Routes>
              <Route path="/automacao/:id/flow" element={ui} />
              <Route path="/automacao/:id" element={<p>formulário</p>} />
            </Routes>
          </MemoryRouter>
        </EngineProvider>
      </SWRConfig>
    </IntlProvider>
  );
}

const record = (grafo: unknown = JSON.stringify(SAVED)) => ({ id: '7', nome: 'Pedido pelo WhatsApp', grafo, _version: 'v1' });
const flowPage = <EntityFlow entity="automacao" id="7" />;

describe('EntityFlow', () => {
  it('abre o grafo gravado com os tipos da spec e grava no campo text com If-Match', async () => {
    const client = fakeClient(record());
    mount(client, flowPage);
    expect(await screen.findByText('1 passos no editor')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Passos da automação' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pedido pelo WhatsApp' }).getAttribute('href')).toBe('/automacao/7');
    expect(editor.kinds.map((k) => k.type)).toEqual(['gatilho', 'fim']);
    expect(editor.kinds[0].icon).toBeTruthy();
    expect(editor.kinds[1].icon).toBeUndefined();
    expect(editor.minimap).toBe(true);
    const save = screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    act(() => editor.onChange!(VALID));
    expect(await screen.findByText('2 passos no editor')).toBeTruthy();
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() => expect(client.update).toHaveBeenCalledWith('automacao', '7', { grafo: JSON.stringify(VALID) }, { ifMatch: 'v1' }));
    await waitFor(() => expect(save.disabled).toBe(true));

    // a segunda gravação vai com a versão que a primeira devolveu
    const renamed = { ...VALID, nodes: VALID.nodes.map((n) => ({ ...n, label: 'Novo' })) };
    act(() => editor.onChange!(renamed));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(client.update).toHaveBeenLastCalledWith('automacao', '7', { grafo: JSON.stringify(renamed) }, { ifMatch: 'v2' })
    );
  });

  it('Descartar volta ao que está gravado', async () => {
    mount(fakeClient(record()), flowPage);
    await screen.findByText('1 passos no editor');
    act(() => editor.onChange!(VALID));
    await screen.findByText('2 passos no editor');
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(await screen.findByText('1 passos no editor')).toBeTruthy();
  });

  it('fluxo com problema não grava e diz quantos são', async () => {
    const client = fakeClient(record(''));
    mount(client, flowPage);
    await screen.findByText('0 passos no editor');
    act(() => editor.onChange!({ nodes: [node('a', 'gatilho')], edges: [] }));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Corrija o problema do fluxo antes de salvar.')).toBeTruthy();
    act(() => editor.onChange!({ nodes: [node('a', 'gatilho'), node('b', 'gatilho')], edges: [] }));
    expect(screen.queryByText(/Corrija/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Corrija os 2 problemas do fluxo antes de salvar.')).toBeTruthy();
    expect(client.update).not.toHaveBeenCalled();
  });

  it('registro que mudou em outra sessão: avisa e Recarregar lê de novo', async () => {
    const client = fakeClient(record(), async () => {
      throw new ApiError(412, 'stale', 'mudou');
    });
    mount(client, flowPage);
    await screen.findByText('1 passos no editor');
    act(() => editor.onChange!(VALID));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText(/Outra pessoa alterou este registro/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }));
    await waitFor(() => expect(client.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('1 passos no editor')).toBeTruthy();
    expect(screen.queryByText(/Outra pessoa/)).toBeNull();
  });

  it('outro erro do servidor aparece como veio; registro sem _version grava sem If-Match', async () => {
    const client = fakeClient({ ...record(), _version: undefined }, async () => {
      throw new ApiError(422, 'invalid', 'Grafo grande demais');
    });
    mount(client, flowPage);
    await screen.findByText('1 passos no editor');
    act(() => editor.onChange!(VALID));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Grafo grande demais')).toBeTruthy();
    expect(client.update).toHaveBeenCalledWith('automacao', '7', { grafo: JSON.stringify(VALID) }, undefined);
    expect(screen.queryByRole('button', { name: 'Recarregar' })).toBeNull();
  });

  it('sem permissão de alterar: só olha, sem Salvar', async () => {
    mount(fakeClient(record()), flowPage, { update: false });
    expect(await screen.findByText('Você pode ver o fluxo, mas não tem permissão para alterar.')).toBeTruthy();
    expect(editor.onChange).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull();
  });

  it('campo travado (denied ou readOnly) também só olha', async () => {
    for (const lock of [{ denied: 'readOnly' }, { readOnly: true }]) {
      const def = { ...automacao, fields: [automacao.fields[0], { ...automacao.fields[1], ...lock }] } as EntityDef;
      mount(fakeClient(record()), flowPage, { def });
      await screen.findByText('1 passos no editor');
      expect(editor.onChange).toBeUndefined();
      cleanup();
    }
  });

  it('JSON quebrado no campo, erro de leitura e entidade sem views.flow', async () => {
    mount(fakeClient(record('{')), flowPage);
    expect(await screen.findByText("O campo 'grafo' não tem um fluxo válido (JSON com nodes e edges).")).toBeTruthy();
    cleanup();

    const failing = { get: vi.fn(async () => Promise.reject(new Error('caiu'))) } as unknown as C3Client;
    mount(failing, flowPage);
    expect(await screen.findByText('caiu')).toBeTruthy();
    cleanup();

    const plain = { ...automacao, views: {} } as EntityDef;
    mount(fakeClient(record()), flowPage, { def: plain });
    expect(screen.getByText("A entidade 'automacao' não declara views.flow.")).toBeTruthy();
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
    expect(editor.minimap).toBe(false);
  });
});

describe('campo do grafo no formulário', () => {
  const field = automacao.fields[1];
  const input = (value: unknown, rec: WireRecord | undefined, readOnly = false) => (
    <FieldInput field={field} value={value} onChange={() => {}} entity="automacao" record={rec} readOnly={readOnly} />
  );

  it('mostra quantos passos e abre o editor do registro', () => {
    mount(fakeClient(record()), input(JSON.stringify(VALID), { id: '7' }));
    expect(screen.getByText('2 passos')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir o fluxo' }).getAttribute('href')).toBe('/automacao/7/flow');
  });

  it('um passo, nenhum e inválido; com o formulário em leitura o botão continua abrindo o editor', () => {
    mount(fakeClient(record()), input(JSON.stringify(SAVED), { id: '7' }, true));
    expect(screen.getByText('1 passo')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir o fluxo' }).getAttribute('href')).toBe('/automacao/7/flow');
    cleanup();
    mount(fakeClient(record()), input('', { id: '7' }));
    expect(screen.getByText('Nenhum passo ainda.')).toBeTruthy();
    cleanup();
    mount(fakeClient(record()), input('{', { id: '7' }));
    expect(screen.getByText('O fluxo gravado não é válido.')).toBeTruthy();
  });

  it('cadastro novo: pede para salvar antes, botão desligado', () => {
    mount(fakeClient(record()), input(undefined, {}));
    expect(screen.getByText('Salve o cadastro para montar o fluxo.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Abrir o fluxo' }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    mount(fakeClient(record()), input(undefined, undefined));
    expect(screen.getByText('Salve o cadastro para montar o fluxo.')).toBeTruthy();
  });

  it('outro campo text da entidade continua texto', () => {
    mount(fakeClient(record()), <FieldInput field={{ ...field, name: 'obs' }} value="oi" onChange={() => {}} entity="automacao" />);
    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
