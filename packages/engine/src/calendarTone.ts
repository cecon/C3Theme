// Cor do evento do calendário (`views.calendar.color`, #65): o nome de um enum (a cor da opção) ou um objeto com o
// campo, o `map` valor → tom e `rules`, que vencem o mapa ("atrasado" fica vermelho seja qual for a situação). Sem React.

import { evaluate, type FieldType } from './conditions.mjs';
import { cellTone } from './rowStyle';
import type { CalendarColor, EntityDef, Tone, WireRecord } from './types';

/** O tom do evento; sem regra, mapa nem cor da opção, o primário. */
export function eventTone(color: CalendarColor | undefined, def: EntityDef, row: WireRecord): Tone {
  if (!color) return 'primary';
  const spec = typeof color === 'string' ? { field: color } : color;
  const types = Object.fromEntries(def.fields.map((f) => [f.name, f.type])) as Record<string, FieldType>;
  const rule = spec.rules?.find((r) => evaluate(r.when, row, types));
  if (rule) return rule.tone;
  const field = spec.field ? def.fields.find((f) => f.name === spec.field) : undefined;
  return (field && cellTone({ field, map: spec.map }, row)) || 'primary';
}
