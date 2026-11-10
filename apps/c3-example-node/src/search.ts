// Busca do Ctrl K do exemplo (spec/v0/search.yaml), a mesma do crates/c3-example: produtos pelo nome. Sistema de
// verdade procura onde quiser (várias tabelas, FTS5 sem acento) e só devolve o que o usuário pode abrir.

import type { Search } from '@c3theme/engine-node';

import { type Db, rows } from './db';

export function exampleSearch(db: Db): Search {
  return {
    search: async (_req, q, limit) => {
      const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      const found = await rows(db, "SELECT id, name, product_group FROM product WHERE name LIKE ? ESCAPE '\\' ORDER BY name, id LIMIT ?", [
        like,
        limit
      ]);
      return found.map(([id, name, group]) => ({
        kind: 'product',
        group: 'Produtos',
        title: String(name),
        snippet: String(group),
        path: `/product/${id}`,
        icon: 'Box',
        at: null
      }));
    }
  };
}
