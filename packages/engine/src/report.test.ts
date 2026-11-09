import { describe, expect, it } from 'vitest';

import { buildReport, reportLines, treeOrder } from './report';
import type { EntityDef, FieldDef, ReportView } from './types';

const def: EntityDef = {
  name: 'venda',
  label: { singular: 'Venda', plural: 'Vendas' },
  fields: [
    {
      name: 'setor',
      type: 'enum',
      options: [
        { value: 'bebida', label: 'Bebida' },
        { value: 'mercearia', label: 'Mercearia' }
      ]
    },
    { name: 'grupo', type: 'reference', entity: 'grupo' },
    { name: 'qtd', type: 'integer' },
    { name: 'total', type: 'decimal', scale: 2 }
  ]
};
const label = (f: FieldDef, v: unknown) =>
  f.type === 'reference' ? String((v as { title: string }).title) : String(f.options?.find((o) => o.value === v)?.label ?? v);
const rows = [
  { id: '1', setor: 'mercearia', grupo: { id: '9', title: 'Grãos' }, qtd: 2, total: '10.10' },
  { id: '2', setor: 'bebida', grupo: { id: '7', title: 'Refrigerante' }, qtd: 1, total: '5.05' },
  { id: '3', setor: 'mercearia', grupo: { id: '8', title: 'Açúcar' }, qtd: 3, total: '0.20' },
  { id: '4', setor: null, grupo: null, qtd: 1, total: '1.00' }
];

describe('reportLines', () => {
  it('grupos na ordem do enum, vazio no fim, subtotal sem erro de ponto flutuante e total geral', () => {
    const view: ReportView = { columns: ['qtd', 'total'], groupBy: ['setor'], subtotals: ['qtd', 'total'] };
    const lines = reportLines(def, view, rows, label);
    expect(lines.filter((l) => l.kind === 'group').map((l) => l.kind === 'group' && l.label)).toEqual(['Bebida', 'Mercearia', '(vazio)']);
    expect(lines.find((l) => l.kind === 'subtotal' && l.label === 'Mercearia')).toMatchObject({
      count: 2,
      sums: { qtd: 5, total: '10.30' }
    });
    expect(lines.at(-1)).toEqual({ kind: 'total', count: 4, sums: { qtd: 7, total: '16.35' } });
  });

  it('dois níveis: o segundo pelo título do reference', () => {
    const view: ReportView = { columns: ['total'], groupBy: ['setor', 'grupo'], subtotals: ['total'] };
    const kinds = reportLines(def, view, rows.slice(0, 3), label).map((l) =>
      l.kind === 'row' ? l.row.id : `${l.kind}:${'label' in l ? l.label : ''}`
    );
    expect(kinds).toEqual([
      'group:Bebida',
      'group:Refrigerante',
      '2',
      'subtotal:Refrigerante',
      'subtotal:Bebida',
      'group:Mercearia',
      'group:Açúcar',
      '3',
      'subtotal:Açúcar',
      'group:Grãos',
      '1',
      'subtotal:Grãos',
      'subtotal:Mercearia',
      'total:'
    ]);
  });

  it('sem subtotals, só os grupos e as linhas', () => {
    const lines = reportLines(def, { columns: ['qtd'], groupBy: ['setor'] }, rows, label);
    expect(lines.some((l) => l.kind === 'subtotal' || l.kind === 'total')).toBe(false);
  });
});

describe('treeOrder', () => {
  it('filha logo abaixo da mãe; mãe fora do filtro vira raiz; ciclo não trava', () => {
    const tree = [
      { id: '1', conta: 'Receita', mae: null },
      { id: '3', conta: 'Custos', mae: null },
      { id: '2', conta: 'Vendas', mae: { id: '1', title: 'Receita' } },
      { id: '4', conta: 'CMV', mae: { id: '3', title: 'Custos' } },
      { id: '5', conta: 'Órfã', mae: { id: '99', title: 'Fora' } },
      { id: '6', conta: 'A', mae: { id: '7' } },
      { id: '7', conta: 'B', mae: { id: '6' } }
    ];
    expect(treeOrder(tree, 'mae').map((t) => `${t.row.id}@${t.depth}`)).toEqual(['1@0', '2@1', '3@0', '4@1', '5@0', '6@0', '7@1']);
  });
});

describe('buildReport', () => {
  const view: ReportView = { columns: ['qtd', 'total'], groupBy: ['setor'], subtotals: ['total'] };

  it('acima do limite não monta linha nenhuma: total pela metade engana', () => {
    expect(buildReport(def, view, { rows: rows.slice(0, 2), total: 10_001 }, 10_000, label)).toEqual({ tooMany: true, lines: [] });
  });

  it('no limite monta tudo', () => {
    const r = buildReport(def, view, { rows, total: 4 }, 4, label);
    expect(r.tooMany).toBe(false);
    expect(r.lines.at(-1)).toMatchObject({ kind: 'total', count: 4 });
  });

  it('enum fora de options (dado antigo) vai para o fim, antes do vazio', () => {
    const drift = [...rows, { id: '5', setor: 'extinto', grupo: null, qtd: 1, total: '1.00' }];
    const groups = reportLines(def, view, drift, label).flatMap((l) => (l.kind === 'group' ? [l.label] : []));
    expect(groups).toEqual(['Bebida', 'Mercearia', 'extinto', '(vazio)']);
  });
});
