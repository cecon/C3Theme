import { describe, expect, it } from 'vitest';

import { movedPatch, parseMonth, rangeWhere, toItem, valueDay } from './calendar';

describe('calendário', () => {
  it('mês inválido na URL cai no mês de hoje', () => {
    const today = new Date(2026, 9, 30);
    expect(parseMonth('2026-13', today)).toEqual({ year: 2026, month: 9 });
    expect(parseMonth('2025-02', today)).toEqual({ year: 2025, month: 1 });
    expect(parseMonth(null, today)).toEqual({ year: 2026, month: 9 });
  });

  it('período sem fim filtra só o início', () => {
    const where = rangeWhere({ start: 'due' }, 'date', new Date(2026, 8, 27), new Date(2026, 10, 8));
    expect(where).toEqual({
      and: [
        { field: 'due', op: 'gte', value: '2026-09-27' },
        { field: 'due', op: 'lt', value: '2026-11-08' }
      ]
    });
  });

  it('período com fim pega o que começou antes e ainda não terminou', () => {
    const where = rangeWhere({ start: 'ini', end: 'fim' }, 'date', new Date(2026, 9, 1), new Date(2026, 10, 1));
    expect(where).toEqual({
      and: [
        { field: 'ini', op: 'lt', value: '2026-11-01' },
        {
          or: [
            { field: 'fim', op: 'gte', value: '2026-10-01' },
            {
              and: [
                { field: 'fim', op: 'null', value: true },
                { field: 'ini', op: 'gte', value: '2026-10-01' }
              ]
            }
          ]
        }
      ]
    });
  });

  it('datetime vira o dia local', () => {
    const local = new Date(2026, 9, 30, 23, 30);
    expect(valueDay(local.toISOString(), 'datetime')).toBe('2026-10-30');
    expect(valueDay('', 'date')).toBeUndefined();
  });

  it('registro vira evento com fim exclusivo; date guarda o último dia', () => {
    const view = { start: 'ini', end: 'fim', allDay: 'todo' };
    expect(toItem({ id: '1', ini: '2026-11-04', fim: '2026-11-05' }, view, 'date', 'Visita')).toEqual({
      id: '1',
      title: 'Visita',
      start: '2026-11-04',
      end: '2026-11-06',
      allDay: true
    });
    expect(toItem({ id: '2', ini: '2026-11-04T12:00:00Z', fim: null, todo: true }, view, 'datetime', 'X')).toMatchObject({
      end: undefined,
      allDay: true
    });
    expect(toItem({ id: '3', ini: '' }, view, 'date', 'X')).toBeUndefined();
  });

  it('arrastar volta ao formato gravado', () => {
    const view = { start: 'ini', end: 'fim', allDay: 'todo' };
    const moved = { start: new Date(2026, 10, 4), end: new Date(2026, 10, 6), allDay: true };
    expect(movedPatch(moved, view, 'date')).toEqual({ ini: '2026-11-04', fim: '2026-11-05' });
    const at = { start: new Date(Date.UTC(2026, 10, 4, 12)), end: null, allDay: false };
    expect(movedPatch(at, view, 'datetime')).toEqual({ ini: '2026-11-04T12:00:00Z', fim: null, todo: false });
  });
});
