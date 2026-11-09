import { describe, expect, it } from 'vitest';

import { allDayPatch, allDayRole, fromDay, isAllDay, toDay } from './calendarForm';
import type { EntityDef } from './types';

const evento: EntityDef = {
  name: 'evento',
  label: { singular: 'Evento', plural: 'Eventos' },
  fields: [
    { name: 'inicio', type: 'datetime' },
    { name: 'fim', type: 'datetime' },
    { name: 'dia_inteiro', type: 'boolean' }
  ],
  views: { calendar: { start: 'inicio', end: 'fim', allDay: 'dia_inteiro' } }
};

// meia-noite local do dia, no formato do fio
const midnight = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h).toISOString().replace(/\.\d{3}Z$/, 'Z');

describe('dia inteiro no formulário do calendário', () => {
  it('reconhece início e fim do calendário', () => {
    expect(allDayRole(evento, 'inicio')).toBe('start');
    expect(allDayRole(evento, 'fim')).toBe('end');
    expect(allDayRole(evento, 'dia_inteiro')).toBeUndefined();
    expect(isAllDay(evento, { dia_inteiro: true })).toBe(true);
  });

  it('o fim exclusivo aparece como o último dia e volta exclusivo', () => {
    expect(toDay(midnight(2026, 11, 6), 'end')).toBe('2026-11-05');
    expect(toDay(midnight(2026, 11, 4), 'start')).toBe('2026-11-04');
    expect(fromDay('2026-11-05', 'end')).toBe(midnight(2026, 11, 6));
    expect(fromDay('2026-11-04', 'start')).toBe(midnight(2026, 11, 4));
  });

  it('ligar o dia inteiro leva às meias-noites dos dias ocupados', () => {
    const r = { inicio: midnight(2026, 11, 4, 14), fim: midnight(2026, 11, 4, 15) };
    expect(allDayPatch(evento, r, 'dia_inteiro', true)).toEqual({ inicio: midnight(2026, 11, 4), fim: midnight(2026, 11, 5) });
  });

  it('desligar sugere das 9h às 10h do dia do início', () => {
    const r = { inicio: midnight(2026, 11, 4), fim: midnight(2026, 11, 6) };
    expect(allDayPatch(evento, r, 'dia_inteiro', false)).toEqual({ inicio: midnight(2026, 11, 4, 9), fim: midnight(2026, 11, 4, 10) });
  });

  it('outro campo não mexe nas datas', () => {
    expect(allDayPatch(evento, { inicio: midnight(2026, 11, 4) }, 'titulo', 'x')).toEqual({});
  });
});
