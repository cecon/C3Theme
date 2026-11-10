// Porta da busca do Ctrl K (`layout.header.search: { records: true }`, spec/v0/search.yaml): o sistema decide o que
// entra (registros, mensagens, índice de texto) e o que o usuário pode ver. Sem ela, GET /_search responde 404.

import type { EngineRequest } from './request';

/** Um achado, como sai em GET /_search. `path` é a rota da shell; `at` em ISO 8601. */
export interface SearchHit {
  kind: string;
  group: string;
  title: string;
  snippet?: string | null;
  path: string;
  icon?: string | null;
  at?: string | null;
}

export interface Search {
  /** Até `limit` (1 a 50) achados de `q` (já sem espaços nas pontas, 2 a 200 caracteres), na ordem da paleta. */
  search(req: EngineRequest, q: string, limit: number): Promise<SearchHit[]> | SearchHit[];
}
