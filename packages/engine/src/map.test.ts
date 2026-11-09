import { describe, expect, it } from 'vitest';

import { blockTone, mapGroups, mapLegend, mapPlaces, MAP_LIMIT } from './map';
import type { EntityDef, FieldDef } from './types';

const def = {
  name: 'nozzle',
  label: { singular: 'Bico', plural: 'Bicos' },
  fields: [
    { name: 'name', type: 'string' },
    { name: 'island', type: 'string' },
    { name: 'pump', type: 'integer' },
    {
      name: 'status',
      type: 'enum',
      options: [
        { value: 'free', label: 'Livre', color: 'success' },
        { value: 'busy', label: 'Abastecendo', color: 'warning' },
        { value: 'off', label: 'Bloqueado' }
      ]
    },
    { name: 'x', type: 'integer' },
    { name: 'y', type: 'integer' },
    { name: 'w', type: 'integer' }
  ]
} as EntityDef;
const label = (_f: FieldDef, v: unknown) => String(v);

describe('mapGroups', () => {
  const rows = [
    { id: '1', island: 'Ilha 2', pump: 3, status: 'free' },
    { id: '2', island: 'Ilha 1', pump: 2, status: 'busy' },
    { id: '3', island: 'Ilha 1', pump: 1, status: 'free' },
    { id: '4', island: 'Ilha 1', pump: 1, status: 'off' }
  ];
  it('aninha ilha → bomba, na ordem do texto', () => {
    const groups = mapGroups(def, { groupBy: ['island', 'pump'] }, rows, label);
    expect(groups.map((g) => g.label)).toEqual(['Ilha 1', 'Ilha 2']);
    expect(groups[0].children.map((g) => [g.label, g.rows.map((r) => r.id)])).toEqual([
      ['1', ['3', '4']],
      ['2', ['2']]
    ]);
    expect(groups[0].rows).toEqual([]);
  });
  it('sem groupBy, uma caixa só com tudo', () => {
    expect(mapGroups(def, {}, rows, label)).toEqual([{ label: '', rows, children: [] }]);
  });
});

describe('mapPlaces', () => {
  it('posiciona pelas coordenadas e calcula o tamanho da grade', () => {
    const rows = [
      { id: '1', x: 1, y: 1 },
      { id: '2', x: 3, y: 2, w: 2 },
      { id: '3', x: null, y: 1 },
      { id: '4', x: 0, y: 1 },
      { id: '5', x: '2', y: '1' }
    ];
    const out = mapPlaces({ position: { x: 'x', y: 'y', w: 'w' } }, rows);
    expect(out.placed.map((p) => [p.row.id, p.x, p.y, p.w, p.h])).toEqual([
      ['1', 1, 1, 1, 1],
      ['2', 3, 2, 2, 1],
      ['5', 2, 1, 1, 1]
    ]);
    expect(out.loose.map((r) => r.id)).toEqual(['3', '4']);
    expect([out.columns, out.lines]).toEqual([4, 2]);
    expect(out.clash).toEqual([]);
  });

  it('bloco em célula já ocupada vai para clash, não para baixo do outro', () => {
    const rows = [
      { id: '1', x: 1, y: 1, w: 2 },
      { id: '2', x: 1, y: 1 },
      { id: '3', x: 2, y: 1 },
      { id: '4', x: 3, y: 1 }
    ];
    const out = mapPlaces({ position: { x: 'x', y: 'y', w: 'w' } }, rows);
    expect(out.placed.map((p) => p.row.id)).toEqual(['1', '4']);
    expect(out.clash.map((r) => r.id)).toEqual(['2', '3']);
  });

  it('coordenada ou tamanho fora do teto fica sem lugar, sem montar a grade gigante', () => {
    const rows = [
      { id: '1', x: 1, y: 1, w: 100000, h: 100000 },
      { id: '2', x: 1e6, y: 1e6 },
      { id: '3', x: MAP_LIMIT.cells, y: 1, w: 2 },
      { id: '4', x: MAP_LIMIT.cells, y: MAP_LIMIT.cells, w: MAP_LIMIT.span },
      { id: '5', x: 2, y: 2, w: MAP_LIMIT.span, h: MAP_LIMIT.span }
    ];
    const out = mapPlaces({ position: { x: 'x', y: 'y', w: 'w', h: 'h' } }, rows);
    expect(out.loose.map((r) => r.id)).toEqual(['1', '2', '3', '4']);
    expect(out.placed.map((p) => p.row.id)).toEqual(['5']);
    expect([out.columns, out.lines]).toEqual([MAP_LIMIT.span + 1, MAP_LIMIT.span + 1]);
  });
});

describe('cor e legenda', () => {
  it('cor da option; sem cor ou valor desconhecido, neutro', () => {
    const view = { color: 'status' };
    expect(blockTone(def, view, { status: 'busy' })).toBe('warning');
    expect(blockTone(def, view, { status: 'off' })).toBe('neutral');
    expect(blockTone(def, view, { status: 'velho' })).toBe('neutral');
    expect(blockTone(def, {}, { status: 'busy' })).toBe('neutral');
  });
  it('legenda só das options com cor, com a contagem', () => {
    const legend = mapLegend(def, { color: 'status' }, [{ status: 'free' }, { status: 'free' }, { status: 'off' }]);
    expect(legend.map((l) => [l.value, l.count])).toEqual([
      ['free', 2],
      ['busy', 0]
    ]);
  });
});
