// `REGEXP` do SQLite com a convenção do c3-engine: `(?i)` na frente = sem diferenciar maiúsculas, sempre Unicode.
// Os dois motores leem o mesmo banco e os mesmos padrões. Diferença conhecida: `\d` e `\w` do JavaScript são só ASCII.

const cache = new Map<string, RegExp>();
const MAX_CACHE = 256;

/** `pattern REGEXP value` (no SQLite, `x REGEXP y` chama `regexp(y, x)`). NULL não casa. */
export function sqliteRegexp(pattern: unknown, value: unknown): number {
  if (typeof pattern !== 'string' || value === null || value === undefined) return 0;
  let re = cache.get(pattern);
  if (!re) {
    const insensitive = pattern.startsWith('(?i)');
    re = new RegExp(insensitive ? pattern.slice(4) : pattern, insensitive ? 'iu' : 'u');
    if (cache.size >= MAX_CACHE) cache.clear();
    cache.set(pattern, re);
  }
  return re.test(String(value)) ? 1 : 0;
}
