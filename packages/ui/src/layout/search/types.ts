import type { ReactNode } from 'react';

/** Um achado do backend na paleta do Ctrl K (GET /_search, spec/v0/search.yaml), já pronto para mostrar. */
export interface SearchHit {
  /** Título do grupo na lista ("Agentes", "Mensagens"); os grupos seguem a ordem em que aparecem. */
  group: string;
  title: string;
  snippet?: string | null;
  /** Rota da shell aberta com Enter ou clique. */
  path: string;
  icon?: ReactNode;
  /** Data ISO mostrada à direita, relativa ("há 2 dias"). */
  at?: string | null;
}

/** Porta da busca de registros: o app chama o backend; falha ou 404 viram lista vazia na paleta. */
export type RecordSearch = (query: string, signal: AbortSignal) => Promise<SearchHit[]>;
