// Datas relativas em filtros (`{"$date": "monthStart"}`, `{"$now": true}`): só em preset e widget do painel
// (checkCondition com relative = true), onde o backend resolve pelo relógio do sistema. Mesmas regras de crates/c3-engine/src/relative_date.rs.

const BASES = ['today', 'weekStart', 'monthStart', 'yearStart'];
const OPS = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte'];

export const isRelative = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && ('$date' in v || '$now' in v);

/** Erro do valor relativo numa folha de condição, ou null. */
export function relativeError(v, type, op) {
  if (!OPS.includes(op)) return 'data relativa só vale com eq, ne, lt, lte, gt e gte';
  if (type !== 'date' && type !== 'datetime') return 'data relativa só vale em campo date ou datetime';
  const extra = Object.keys(v).find((k) => !['$date', '$now', 'offset', 'unit'].includes(k));
  if (extra) return `chave desconhecida '${extra}'`;
  if (v.offset !== undefined && !Number.isSafeInteger(v.offset)) return "'offset' precisa ser inteiro";
  if ('$now' in v) {
    if ('$date' in v || v.$now !== true) return 'use {"$now": true} ou {"$date": ...}, não os dois';
    if (type !== 'datetime') return "'$now' só vale em datetime; em date, use '$date'";
    if (v.unit !== undefined && !['minute', 'hour', 'day'].includes(v.unit)) return "'unit' de '$now' é minute, hour ou day";
    return null;
  }
  if (!BASES.includes(v.$date)) return `'$date' precisa ser ${BASES.join(', ')}`;
  if (v.unit !== undefined && !['day', 'week', 'month', 'year'].includes(v.unit)) return "'unit' de '$date' é day, week, month ou year";
  return null;
}
