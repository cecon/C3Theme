import type { AccentColor } from '@c3theme/ui';

/** Cor nomeada constante ou escolhida por um campo do registro (ex.: cargo → cor). */
export type AccentSpec = AccentColor | { field: string; map?: Record<string, AccentColor> };

export function resolveAccent(spec: AccentSpec | undefined, row: Record<string, unknown>): AccentColor | undefined {
  if (typeof spec === 'string') return spec;
  if (!spec) return undefined;
  const value = String(row[spec.field] ?? '');
  const color = spec.map ? spec.map[value] : value;
  return /^accent:[a-z][a-z\d_-]*$/i.test(color ?? '') ? (color as AccentColor) : undefined;
}
