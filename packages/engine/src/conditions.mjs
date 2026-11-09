// Avaliador de referência das condições da spec v0 (spec/README.md#condições).
// Usado pela shell (visibleWhen, requiredWhen), pela suíte de conformidade (para conferir o filtro do
// backend) e pelo pnpm spec:check. Fica no @c3theme/engine porque a shell o leva no pacote instalado.
// A shell e os backends (Rust/Node) precisam passar nos mesmos casos de
// spec/v0/conformance/conditions.json.

export const OPS_BY_TYPE = {
  string: ['eq', 'ne', 'in', 'contains', 'null'],
  text: ['eq', 'ne', 'in', 'contains', 'null'],
  email: ['eq', 'ne', 'in', 'contains', 'null'],
  integer: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'null'],
  decimal: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'null'],
  date: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'null'],
  datetime: ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'null'],
  boolean: ['eq', 'ne', 'null'],
  enum: ['eq', 'ne', 'in', 'null'],
  flags: ['eq', 'ne', 'in', 'null'],
  reference: ['eq', 'ne', 'in', 'null'],
  file: ['null']
};

// decimal trafega como string ("1234.50"): compara como número exato, nunca como texto nem float
const decimalKey = (s) => {
  const [int, frac = ''] = String(s).split('.');
  return BigInt(int + frac.padEnd(10, '0').slice(0, 10));
};

const normalize = (type, v) => {
  if (type === 'reference' && v && typeof v === 'object') return v.id; // leitura vem { id, title }
  if (type === 'decimal') return decimalKey(v);
  return v;
};

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function evaluate(cond, record, types) {
  if ('and' in cond) return cond.and.every((c) => evaluate(c, record, types));
  if ('or' in cond) return cond.or.some((c) => evaluate(c, record, types));
  if ('not' in cond) return !evaluate(cond.not, record, types);

  const { field, op, value } = cond;
  // `id` é o id implícito do registro: um reference
  const type = field === 'id' ? 'reference' : types[field];
  if (!type) throw new Error(`campo desconhecido: ${field}`);
  if (!OPS_BY_TYPE[type].includes(op)) throw new Error(`operador ${op} não vale para ${type}`);

  const raw = record[field];
  const isNull = raw === null || raw === undefined || raw === '';
  if (op === 'null') return isNull === value;
  // campo vazio: só 'ne' é verdadeiro (vazio é diferente de qualquer valor)
  if (isNull) return op === 'ne';

  const actual = normalize(type, raw);
  switch (op) {
    case 'eq':
      return actual === normalize(type, value);
    case 'ne':
      return actual !== normalize(type, value);
    case 'in':
      return value.some((v) => normalize(type, v) === actual);
    case 'contains':
      return String(actual).toLowerCase().includes(String(value).toLowerCase());
    default: {
      const c = compare(actual, normalize(type, value));
      return { lt: c < 0, lte: c <= 0, gt: c > 0, gte: c >= 0 }[op];
    }
  }
}

// campos citados numa condição, para checagem estática
export function* conditionFields(cond) {
  if ('and' in cond) for (const c of cond.and) yield* conditionFields(c);
  else if ('or' in cond) for (const c of cond.or) yield* conditionFields(c);
  else if ('not' in cond) yield* conditionFields(cond.not);
  else yield cond;
}

// Filtro no reference (spec/README.md, "Filtro no reference"): troca cada `{"$field": nome}` pelo valor do campo no
// registro de quem aponta; folha com variável vazia sai (não restringe). `null` = nada restringe.
export function resolveFilter(cond, record) {
  if ('and' in cond) {
    const kept = cond.and.map((c) => resolveFilter(c, record)).filter(Boolean);
    return kept.length ? { and: kept } : null;
  }
  if ('or' in cond) {
    const kept = cond.or.map((c) => resolveFilter(c, record));
    return kept.some((c) => c === null) ? null : { or: kept };
  }
  if ('not' in cond) {
    const inner = resolveFilter(cond.not, record);
    return inner && { not: inner };
  }
  const name = cond.value && typeof cond.value === 'object' && !Array.isArray(cond.value) ? cond.value.$field : undefined;
  if (name === undefined) return cond;
  let v = record[name];
  if (v && typeof v === 'object') v = v.id; // reference lido vem { id, title }
  return v === null || v === undefined || v === '' ? null : { ...cond, value: v };
}
