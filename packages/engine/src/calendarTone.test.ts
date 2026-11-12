// Cor do evento do calendário (#65): enum, mapa pelo campo e a regra que vence o mapa.
import { describe, expect, it } from 'vitest';

import { eventTone } from './calendarTone';
import { initialView, SLOT } from './pages/calendar/calendarMode';
import type { EntityDef } from './types';

const def = {
  name: 'agenda',
  label: { singular: 'A', plural: 'A' },
  fields: [
    {
      name: 'situacao',
      type: 'enum',
      options: [
        { value: 'P', label: 'Pendente', color: 'warning' },
        { value: 'F', label: 'Formulação' }
      ]
    },
    { name: 'atrasado', type: 'boolean' }
  ]
} as unknown as EntityDef;
const late = { when: { field: 'atrasado', op: 'eq', value: true }, tone: 'danger' } as const;

describe('eventTone', () => {
  it('sem cor, o primário; com o nome do enum, a cor da opção (ou primário sem cor)', () => {
    expect(eventTone(undefined, def, { situacao: 'P' })).toBe('primary');
    expect(eventTone('situacao', def, { situacao: 'P' })).toBe('warning');
    expect(eventTone('situacao', def, { situacao: 'F' })).toBe('primary');
  });

  it('map pelo valor do campo; fora do mapa, primário', () => {
    const color = { field: 'situacao', map: { F: 'info' as const } };
    expect(eventTone(color, def, { situacao: 'F' })).toBe('info');
    expect(eventTone(color, def, { situacao: 'P' })).toBe('primary');
  });

  it('a regra vence o mapa; sem regra valendo, o mapa', () => {
    const color = { field: 'situacao', map: { F: 'info' as const }, rules: [late] };
    expect(eventTone(color, def, { situacao: 'F', atrasado: true })).toBe('danger');
    expect(eventTone(color, def, { situacao: 'F', atrasado: false })).toBe('info');
    expect(eventTone({ rules: [late] }, def, { atrasado: false })).toBe('primary');
  });
});

describe('calendarMode', () => {
  it('abre na visão do range (padrão o mês) e no celular sempre na agenda', () => {
    expect(initialView(undefined, false)).toBe('dayGridMonth');
    expect(initialView('week', false)).toBe('timeGridWeek');
    expect(initialView('day', false)).toBe('timeGridDay');
    expect(initialView('week', true)).toBe('listWeek');
  });

  it('a faixa de hora', () => {
    expect(SLOT.hour).toBe('01:00:00');
    expect(SLOT['30min']).toBe('00:30:00');
  });
});
