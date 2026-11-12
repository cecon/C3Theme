// #108: o painel por resumo lê caminhos de um documento, sem entidade.
import { describe, expect, it } from 'vitest';

import {
  formatSummary,
  isSummaryWidget,
  itemsAt,
  meterLevel,
  numberAt,
  pick,
  shares,
  statusActions,
  statusNotices,
  type ShareWidget,
  type StatusWidget
} from './summary';

describe('caminhos do resumo', () => {
  it('pick segue os pontos e para no que falta', () => {
    const doc = { a: { b: { c: 3 } }, n: null };
    expect(pick(doc, 'a.b.c')).toBe(3);
    expect(pick(doc, 'a.x.c')).toBeUndefined();
    expect(pick(doc, 'n.c')).toBeUndefined();
    expect(pick('texto', 'length')).toBeUndefined();
  });

  it('itemsAt: lista vira itens, objeto vira um item, o resto nenhum', () => {
    expect(itemsAt({ l: [{ a: 1 }, null, 2, { a: 2 }] }, 'l')).toEqual([{ a: 1 }, { a: 2 }]);
    expect(itemsAt({ o: { a: 1 } }, 'o')).toEqual([{ a: 1 }]);
    expect(itemsAt({ s: 'x' }, 's')).toEqual([]);
    expect(itemsAt({}, 'nada')).toEqual([]);
  });

  it('numberAt aceita número e texto numérico; o resto é undefined', () => {
    const item = { n: 4, s: '2.5', vazio: '  ', t: 'abc' };
    expect(numberAt(item, 'n')).toBe(4);
    expect(numberAt(item, 's')).toBe(2.5);
    expect(numberAt(item, 'vazio')).toBeUndefined();
    expect(numberAt(item, 't')).toBeUndefined();
    expect(numberAt(item, undefined)).toBeUndefined();
  });

  it('isSummaryWidget separa os tipos do resumo', () => {
    expect(['meter', 'share', 'status', 'kpi'].map((type) => isSummaryWidget({ type }))).toEqual([true, true, true, false]);
  });
});

describe('formatSummary', () => {
  it('formata número, %, moeda, data e texto', () => {
    expect(formatSummary(1234567, 'number', 'pt-BR')).toBe('1.234.567');
    expect(formatSummary(42.44, 'percent', 'pt-BR')).toBe('42,4%');
    expect(formatSummary(41.3, 'money', 'en-US', 'USD')).toBe('$41.30');
    expect(formatSummary(41.3, 'money', 'pt-BR', 'xx')).toBe('41,3');
    expect(formatSummary('2.4.0', 'text', 'pt-BR')).toBe('2.4.0');
    expect(formatSummary('beta', 'number', 'pt-BR')).toBe('beta');
    expect(formatSummary('2026-11-01T10:30:00', 'datetime', 'pt-BR')).toBe('01/11/2026, 10:30');
    expect(formatSummary('ontem', 'datetime', 'pt-BR')).toBe('ontem');
  });

  it('valor ausente vira vazio', () => {
    expect([undefined, null, ''].map((v) => formatSummary(v, 'number', 'pt-BR'))).toEqual(['', '', '']);
  });
});

describe('meterLevel', () => {
  it('cor pelo % do limite: abaixo de 80 primário, de 80 a 100 atenção, acima perigo', () => {
    expect(meterLevel(79, 100)).toEqual({ pct: 79, tone: 'primary' });
    expect(meterLevel(80, 100)).toEqual({ pct: 80, tone: 'warning' });
    expect(meterLevel(100, 100)).toEqual({ pct: 100, tone: 'warning' });
    expect(meterLevel(101, 100).tone).toBe('danger');
    expect(meterLevel(5, 0)).toEqual({ pct: 0, tone: 'primary' });
  });
});

describe('shares', () => {
  const w: ShareWidget = { type: 'share', title: 't', from: 'a', label: 'nome', value: 'v' };
  const items = [
    { nome: 'B', v: 1, p: 10 },
    { nome: 'A', v: 3, p: 90 }
  ];
  it('sem share, divide pela soma; maiores primeiro', () => {
    expect(shares(w, items).map((r) => [r.label, r.share])).toEqual([
      ['A', 75],
      ['B', 25]
    ]);
  });
  it('com share, usa o declarado; limit corta', () => {
    expect(shares({ ...w, share: 'p', limit: 1 }, items).map((r) => [r.label, r.share])).toEqual([['A', 90]]);
  });
  it('total zero dá 0% e sem nome vira vazio', () => {
    expect(shares(w, [{ v: 0 }])).toMatchObject([{ label: '', share: 0, value: 0 }]);
  });
});

describe('status', () => {
  const w: StatusWidget = {
    type: 'status',
    title: 't',
    from: 'u',
    state: 'estado',
    states: {},
    actions: [
      { id: 'verificar', label: 'Verificar', path: '/v' },
      { id: 'baixar', label: 'Baixar', path: '/b' },
      { id: 'instalar', label: 'Instalar', path: '/i' }
    ],
    notices: [
      { when: { field: 'canal', op: 'eq', value: 'beta' }, text: 'Beta' },
      { when: { field: 'n', op: 'gt', value: 2 }, text: 'Muitos' }
    ]
  };

  it('sem o objeto de disponibilidade, todas as ações aparecem habilitadas', () => {
    expect(statusActions(w, {}).map((a) => [a.action.id, a.disabled])).toEqual([
      ['verificar', false],
      ['baixar', false],
      ['instalar', false]
    ]);
  });

  it('com ele, só as liberadas aparecem; a desabilitada leva a instrução', () => {
    const item = { actions: { instalar: { disabled: true, instruction: 'Espere o download.' }, verificar: true, baixar: 'x' } };
    expect(statusActions(w, item)).toEqual([
      { action: w.actions![0], disabled: false },
      { action: w.actions![2], disabled: true, instruction: 'Espere o download.' }
    ]);
  });

  it('availability muda o caminho; instrução que não é texto é ignorada', () => {
    const item = { pode: { baixar: { instruction: 3 } } };
    expect(statusActions({ ...w, availability: 'pode' }, item)).toEqual([
      { action: w.actions![1], disabled: false, instruction: undefined }
    ]);
    expect(statusActions({ ...w, actions: undefined }, item)).toEqual([]);
  });

  it('avisos valem pela condição sobre o objeto, com o tipo pelo valor', () => {
    expect(statusNotices(w, { canal: 'beta', n: 3 }).map((n) => n.text)).toEqual(['Beta', 'Muitos']);
    expect(statusNotices(w, { canal: 'estavel', n: 1 })).toEqual([]);
    expect(statusNotices({ ...w, notices: [{ when: { field: 'ok', op: 'eq', value: true }, text: 'Ok' }] }, { ok: true })).toHaveLength(1);
    expect(statusNotices({ ...w, notices: undefined }, {})).toEqual([]);
  });
});
