// @vitest-environment jsdom
// Saldo anterior da lista (#36): o filtro sem o período e com "antes do início"; só com data inicial e grupo fixado.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { C3Client } from '../../api';
import { EngineProvider } from '../../context';
import { toCsv } from '../../export';
import type { EntityDef, FieldDef, ListOpening } from '../../types';
import { OpeningRow } from './OpeningRow';
import { openingWhere, resolvedWhere, useListOpening } from './useListOpening';
import type { ListQuery } from './useListQuery';

afterEach(cleanup);

const opening: ListOpening = { field: 'saldo', dateField: 'data', groupBy: ['produto'] };
const prod = { field: 'produto', op: 'eq', value: '1' } as const;
const from = { field: 'data', op: 'gte', value: '2026-03-01' } as const;
const to = { field: 'data', op: 'lte', value: '2026-03-31' } as const;
const mov = { name: 'mov', fields: [{ name: 'data', type: 'date' }] } as unknown as EntityDef;
const monthStart = { field: 'data', op: 'gte', value: { $date: 'monthStart' } } as const;

describe('openingWhere', () => {
  it('tira os limites do período e põe antes do início; gt vira lte', () => {
    expect(openingWhere({ and: [prod, { and: [from, to] }] }, opening)).toEqual({
      where: { and: [prod, { field: 'data', op: 'lt', value: '2026-03-01' }] },
      from: '2026-03-01'
    });
    expect(openingWhere({ and: [prod, { ...from, op: 'gt' }] }, opening)?.where).toEqual({
      and: [prod, { field: 'data', op: 'lte', value: '2026-03-01' }]
    });
  });

  it('sem data inicial ou sem o grupo fixado, não vale', () => {
    expect(openingWhere({ and: [prod, to] }, opening)).toBeUndefined();
    expect(openingWhere(from, opening)).toBeUndefined();
    expect(openingWhere(undefined, opening)).toBeUndefined();
    expect(openingWhere(from, { ...opening, groupBy: undefined })?.from).toBe('2026-03-01');
  });

  it('com dois inícios (preset e barra), vale o mais recente, em qualquer ordem (#68)', () => {
    const later = { field: 'data', op: 'gte', value: '2026-03-10' } as const;
    expect(openingWhere({ and: [from, prod, later] }, opening)?.from).toBe('2026-03-10');
    expect(openingWhere({ and: [later, prod, from] }, opening)?.from).toBe('2026-03-10');
    expect(openingWhere({ and: [later, prod, { ...later, op: 'gt' }] }, opening)?.where).toEqual({
      and: [prod, { field: 'data', op: 'lt', value: '2026-03-10' }]
    });
  });
});

describe('resolvedWhere (#68)', () => {
  it('troca o $date do preset pela data e o saldo vale', () => {
    const where = resolvedWhere({ and: [monthStart, prod] }, mov, new Date(2026, 2, 15, 12));
    expect(where).toEqual({ and: [{ ...monthStart, value: '2026-03-01' }, prod] });
    expect(openingWhere(where, opening)?.from).toBe('2026-03-01');
  });

  it('data relativa inválida fica como veio (o servidor diz o erro): sem saldo', () => {
    const bad = { and: [{ field: 'data', op: 'gte', value: { $date: 'ontem' } }, prod] } as never;
    expect(resolvedWhere(bad, mov, new Date())).toBe(bad);
    expect(openingWhere(resolvedWhere(bad, mov, new Date()), opening)).toBeUndefined();
  });
});

function Probe({ o, where }: { o: ListOpening; where: unknown }) {
  const got = useListOpening('mov', mov, o, { where, q: '', sourceParams: {} } as unknown as ListQuery);
  return <span data-testid="got">{got ? `${got.value}@${got.from}` : 'nada'}</span>;
}

function wrap(client: Partial<C3Client>, children: ReactNode) {
  const value = { client: client as C3Client, app: { name: 'demo' } as never, entities: {}, components: {} };
  return render(
    <IntlProvider locale="pt-BR" onError={() => {}}>
      <EngineProvider value={value}>{children}</EngineProvider>
    </IntlProvider>
  );
}

describe('useListOpening', () => {
  it('sum pelo _aggregate; last pela última linha antes da data', async () => {
    const aggregate = vi.fn(async (_e: string, _p: unknown) => [{ key: null, value: 42 }]);
    wrap({ aggregate } as never, <Probe o={opening} where={{ and: [prod, from] }} />);
    await waitFor(() => expect(screen.getByTestId('got').textContent).toBe('42@2026-03-01'));
    expect(aggregate.mock.calls[0][1]).toMatchObject({ measure: ['sum:saldo'] });
    cleanup();
    const list = vi.fn(async (_e: string, _p: unknown) => ({ data: [{ id: '9', saldo: 30 }], meta: { total: 1 } }));
    wrap({ list } as never, <Probe o={{ ...opening, measure: 'last' }} where={{ and: [prod, from] }} />);
    await waitFor(() => expect(screen.getByTestId('got').textContent).toBe('30@2026-03-01'));
    expect(list.mock.calls[0][1]).toMatchObject({ sort: '-data,-id' });
  });

  it('preset com $date antes do filtro da barra: o saldo aparece (#68)', async () => {
    const aggregate = vi.fn(async (_e: string, _p: unknown) => [{ key: null, value: 7 }]);
    wrap({ aggregate } as never, <Probe o={opening} where={{ and: [monthStart, prod] }} />);
    await waitFor(() => expect(screen.getByTestId('got').textContent).toMatch(/^7@\d{4}-\d{2}-01$/));
  });

  it('sem filtro de período, nada', () => {
    wrap({}, <Probe o={opening} where={prod} />);
    expect(screen.getByTestId('got').textContent).toBe('nada');
  });
});

describe('linha e CSV', () => {
  const fields = [
    { name: 'data', type: 'date', label: 'Data' },
    { name: 'saldo', type: 'integer', label: 'Saldo' }
  ] as FieldDef[];
  it('a linha mostra o rótulo e o saldo; o CSV traz a linha logo depois do cabeçalho', () => {
    const columns = fields.map((def) => ({ field: def.name, def, extras: {} }));
    wrap(
      {},
      <table>
        <tbody>
          <OpeningRow opening={{ field: 'saldo', value: 1234, label: 'Saldo anterior' }} columns={columns} lead={1} trail />
        </tbody>
      </table>
    );
    expect(screen.getByTestId('opening-row').textContent).toBe('Saldo anterior1.234');
    const csv = toCsv(
      fields,
      [{ data: '2026-03-02', saldo: 1 }],
      'pt-BR',
      (f) => String(f.label),
      (_f, v) => v,
      undefined,
      {
        field: 'saldo',
        value: 30,
        label: 'Saldo anterior'
      }
    );
    expect(csv.split('\r\n').slice(0, 2)).toEqual(['﻿Data;Saldo', 'Saldo anterior;30']);
  });
});
