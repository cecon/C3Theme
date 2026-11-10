// Busca do Ctrl K em memória (GET /_search, spec/v0/search.yaml): procura nos campos de busca da lista de cada
// entidade (`views.list.search`, ou o `titleField`), sem acento e sem caixa, na ordem das entidades do seed.

import type { SearchResult } from '../api';
import type { Text } from '../types';
import type { Store } from './records';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
const plain = (t: Text | undefined, fallback: string) => (typeof t === 'string' ? t : (t?.defaultMessage ?? fallback));

export function memorySearch(store: Store, q: string, limit: number): SearchResult[] {
  const needle = fold(q.trim());
  const hits: SearchResult[] = [];
  for (const def of Object.values(store.defs)) {
    const titleField = def.titleField ?? 'id';
    const fields = def.views?.list?.search ?? [titleField];
    for (const row of store.tables[def.name] ?? []) {
      if (hits.length >= limit) return hits;
      const values = fields.map((f) => (typeof row[f] === 'string' ? (row[f] as string) : ''));
      if (!values.some((v) => fold(v).includes(needle))) continue;
      const title = String(row[titleField] ?? row.id);
      hits.push({
        kind: def.name,
        group: plain(def.label.plural, def.name),
        title,
        snippet: values.find((v) => v && v !== title) ?? null,
        path: `/${def.name}/${row.id}`,
        icon: def.icon ?? null,
        at: null
      });
    }
  }
  return hits;
}
