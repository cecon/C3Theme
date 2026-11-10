// @vitest-environment jsdom
// Folha impressa do registro (#39): seções escolhidas, related inteira, coluna em branco e a impressão do navegador.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EngineProvider } from '../../context';
import { createMemoryClient } from '../../memory/memoryClient';
import type { EntityDef } from '../../types';
import PrintButton, { printPort } from './PrintButton';
import { printSections } from './RecordPrint';

afterEach(cleanup);

const item = {
  name: 'item',
  label: { singular: 'Item', plural: 'Itens' },
  fields: [
    { name: 'inv', type: 'reference', entity: 'inv', label: 'Inventário' },
    { name: 'produto', type: 'string', label: 'Produto' },
    { name: 'contado', type: 'integer', label: 'Contado' },
    { name: 'diferenca', type: 'integer', label: 'Diferença', negativeTone: 'error' }
  ]
} as unknown as EntityDef;
const inv = {
  name: 'inv',
  label: { singular: 'Inventário', plural: 'Inventários' },
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string', label: 'Nome' },
    { name: 'senha', type: 'string', label: 'Senha', writeOnly: true },
    { name: 'obs', type: 'string', label: 'Observação' }
  ],
  views: {
    form: {
      print: { sections: [0, 2], blank: ['contado'] },
      sections: [
        { title: 'Dados', rows: [['nome', 'senha']] },
        { title: 'Observação', rows: [['obs']] },
        { title: 'Contagem', related: { entity: 'item', field: 'inv' } }
      ]
    }
  }
} as unknown as EntityDef;

describe('impressão do registro', () => {
  it('printSections: as escolhidas, ou as com campos ou related', () => {
    expect(printSections(inv).map((s) => s.title)).toEqual(['Dados', 'Contagem']);
    const free = { ...inv, views: { form: { sections: [...inv.views!.form!.sections, { component: 'x' }] } } } as EntityDef;
    expect(printSections(free)).toHaveLength(3);
  });

  it('monta a folha com todas as filhas e a coluna em branco, e chama a impressão', async () => {
    const print = vi.spyOn(printPort, 'print').mockImplementation(() => {});
    const client = createMemoryClient({
      app: { name: 'Loja', entities: ['inv', 'item'] } as never,
      entities: [inv, item],
      records: {
        item: Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1), inv: '1', produto: `P${i + 1}`, contado: 3, diferenca: i - 5 }))
      }
    });
    const value = { client, app: { name: 'Loja' } as never, entities: { item: { def: item, capabilities: {} } } as never, components: {} };
    render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <PrintButton def={inv} record={{ id: '1', nome: 'Março', senha: null, obs: 'x' }} />
        </EngineProvider>
      </IntlProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir' }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
    await act(async () => {});
  });

  it('a folha: cabeçalho, campos sem a senha, 30 linhas e o contado vazio', async () => {
    vi.spyOn(printPort, 'print').mockImplementation(() => {});
    const { default: RecordPrint } = await import('./RecordPrint');
    const client = createMemoryClient({
      app: { name: 'Loja', entities: ['inv', 'item'] } as never,
      entities: [inv, item],
      records: {
        item: Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1), inv: '1', produto: `P${i + 1}`, contado: 3, diferenca: i - 5 }))
      }
    });
    const value = { client, app: { name: 'Loja' } as never, entities: { item: { def: item, capabilities: {} } } as never, components: {} };
    render(
      <IntlProvider locale="pt-BR" onError={() => {}}>
        <EngineProvider value={value}>
          <RecordPrint def={inv} record={{ id: '1', nome: 'Março', obs: 'x' }} onReady={() => {}} />
        </EngineProvider>
      </IntlProvider>
    );
    const sheet = await screen.findByTestId('record-print');
    expect(sheet.textContent).toContain('Loja');
    expect(sheet.textContent).toContain('Inventário Março');
    expect(sheet.textContent).not.toContain('Senha');
    expect(sheet.textContent).not.toContain('Observação');
    const rows = sheet.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(30);
    expect(rows[0].querySelectorAll('td')[1].textContent).toBe('');
    // negativeTone: o negativo sai num span com a cor do tom; o positivo, texto puro
    expect(rows[0].querySelectorAll('td')[2].querySelector('span')?.textContent).toBe('-5');
    expect(rows[10].querySelectorAll('td')[2].querySelector('span')).toBeNull();
  });
});
