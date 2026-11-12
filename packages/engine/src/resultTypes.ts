// Respostas da API de lista, ação e lote (spec/v0/openapi.yaml).

import type { WireRecord } from './types';

export interface ListResult {
  data: WireRecord[];
  /** `columns`: consulta do sistema que escolhe as colunas pelos parâmetros (#60). */
  meta: { page: number; pageSize: number; total: number; columns?: { field: string; label?: string }[] };
}

export type FieldErrors = Record<string, { code: string; message: string }[]>;

export interface ActionResult {
  /** Registro depois da ação; null se ela o removeu ou tirou do escopo; ausente quando veio arquivo. */
  data?: WireRecord | null;
  message?: string | null;
  /** Arquivo da ação `returns: "file"`, para baixar. */
  file?: { name: string; blob: Blob };
  /** Registro que a shell abre depois (o rascunho criado pela ação). */
  open?: { entity: string; id: string };
  /** Endereço que a shell abre (ou baixa) na mesma aba: o arquivo não passa pelo motor. */
  link?: string;
  /** Ação `steps`: `done` de `total`; a shell chama de novo com o `cursor` até `done == total`. */
  progress?: { total: number; done: number; cursor: unknown };
}

/** Resultado de um id na ação em lote: o mesmo da ação de um registro, ou o erro dele. */
export type BulkItem =
  ({ id: string; ok: true } & ActionResult) | { id: string; ok: false; error: { code: string; message: string; fields?: FieldErrors } };

export interface BulkResult {
  results: BulkItem[];
  meta: { ok: number; failed: number };
}
