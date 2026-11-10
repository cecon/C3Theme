// @vitest-environment jsdom
// Marcar vários no checklist (#11): Shift+clique marca o intervalo da tela (com a busca) e arrastar aplica o estado.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../api';
import { EngineProvider } from '../context';
import type { Capabilities, EntityDef, RelatedDef, WireRecord } from '../types';
import ChildChecklist from './ChildChecklist';
import { rangeBetween } from './useChecklistGestures';

afterEach(cleanup);

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: false };
const agente: EntityDef = {
  name: 'agente',
  label: { singular: 'Agente', plural: 'Agentes' },
  titleField: 'nome',
  fields: [{ name: 'nome', type: 'string', label: 'Nome' }]
};
const uso: EntityDef = {
  name: 'uso',
  label: { singular: 'Uso', plural: 'Usos' },
  fields: [
    { name: 'habilidade_id', type: 'string', label: 'Habilidade' },
    { name: 'agente_id', type: 'reference', entity: 'agente', label: 'Agente' }
  ]
};
const NOMES = ['Ana', 'Bia', 'Caio', 'Davi', 'Eva', 'Gil', 'Ivo', 'Lia', 'Max', 'Noa', 'Rui', 'Téo', 'Ugo', 'Zoe'];
const options = NOMES.map((nome, i) => ({ id: String(i + 1), nome }));

function setup(maxItems?: number, initial: WireRecord[] = [], errors: Record<string, string> = {}) {
  const related = {
    entity: 'uso',
    field: 'habilidade_id',
    option: 'agente_id',
    display: 'checklist',
    save: 'with_parent',
    maxItems
  } as RelatedDef;
  const list = vi.fn().mockResolvedValue({ data: options, meta: { total: options.length } });
  const value = {
    client: { list } as unknown as C3Client,
    app: { name: 'demo' } as never,
    entities: { agente: { def: agente, capabilities: ALL }, uso: { def: uso, capabilities: ALL } },
    components: {}
  };
  let current: WireRecord[] = [];
  function Host() {
    const [rows, setRows] = useState<WireRecord[]>(initial);
    current = rows;
    return <ChildChecklist related={related} rows={rows} onChange={setRows} errors={errors} editing />;
  }
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <SWRConfig value={{ provider: () => new Map() }}>
          <EngineProvider value={value}>
            <Host />
          </EngineProvider>
        </SWRConfig>
      </IntlProvider>
    </ThemeProvider>
  );
  const checked = () => current.map((r) => (r.agente_id as { title: string }).title);
  return { checked };
}

const box = (name: string) => screen.getByRole('checkbox', { name });

describe('checklist: marcar vários', () => {
  it('Shift+clique marca e desmarca o intervalo, na ordem da tela filtrada', async () => {
    const { checked } = setup();
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Bia' }));
    fireEvent.click(box('Eva'), { shiftKey: true });
    expect(checked()).toEqual(['Bia', 'Caio', 'Davi', 'Eva']);
    fireEvent.click(box('Caio'), { shiftKey: true });
    expect(checked()).toEqual(['Bia']);
    // com a busca, o intervalo é só do que aparece
    fireEvent.change(screen.getByPlaceholderText('Buscar'), { target: { value: 'a' } });
    fireEvent.click(box('Lia'), { shiftKey: true });
    // Gil e Ivo estão entre Caio e Lia, mas a busca escondeu
    expect(checked()).toEqual(['Bia', 'Caio', 'Davi', 'Eva', 'Lia']);
  });

  it('arrastar aplica o estado da primeira caixa e respeita o maxItems', async () => {
    const { checked } = setup(3);
    const ana = await screen.findByRole('checkbox', { name: 'Ana' });
    fireEvent.pointerDown(ana, { button: 0 });
    for (const n of ['Bia', 'Caio', 'Davi']) fireEvent.pointerEnter(box(n).closest('tr')!);
    fireEvent.pointerUp(window);
    fireEvent.click(ana);
    expect(checked()).toEqual(['Ana', 'Bia', 'Caio']);
    expect(screen.getByText(/Limite de marcadas atingido/)).toBeTruthy();
    // arrastar de uma marcada desmarca
    fireEvent.pointerDown(box('Bia'), { button: 0 });
    fireEvent.pointerEnter(box('Caio').closest('tr')!);
    fireEvent.pointerUp(window);
    expect(checked()).toEqual(['Ana']);
  });

  it('rangeBetween sem a âncora à vista não monta intervalo', () => {
    expect(rangeBetween(options, '1', '3')?.map((o) => o.id)).toEqual(['1', '2', '3']);
    expect(rangeBetween(options, undefined, '3')).toBeUndefined();
  });
});

describe('checklist: erros', () => {
  it('erro de linha que a matriz não desenha aparece no alerta da seção', async () => {
    setup(undefined, [{ agente_id: null }], { 'uso.0.agente_id': 'Obrigatório' });
    expect((await screen.findByRole('alert')).textContent).toContain('Obrigatório');
  });
});
