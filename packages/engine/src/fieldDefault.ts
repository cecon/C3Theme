// `default` dos campos no formato trafegado (#47): decimal vai como texto, então o número da spec (`"default": 1`)
// vira "1.0000" na escala do campo; os outros tipos passam como vieram. Sem React.

import type { FieldDef } from './types';

type WithDefault = Pick<FieldDef, 'name' | 'type' | 'default' | 'scale'> & { readOnly?: boolean };

export function fieldDefault(f: WithDefault): unknown {
  if (f.type !== 'decimal' || typeof f.default !== 'number') return f.default;
  return f.scale === undefined ? String(f.default) : f.default.toFixed(f.scale);
}

/** Os defaults declarados, por nome do campo. `writable`: só os que o usuário edita (sem readOnly). */
export function defaultsOf(fields: WithDefault[], writable = false): Record<string, unknown> {
  return Object.fromEntries(
    fields.filter((f) => f.default !== undefined && !(writable && f.readOnly)).map((f) => [f.name, fieldDefault(f)])
  );
}
