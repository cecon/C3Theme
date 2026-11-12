// Erro do contrato HTTP: o envelope `{ error }` da resposta, com o status e, no 503 de sistema fora do ar, o `status`.

import type { AppStatusDef } from './status/AppStatus';
import { statusFromReply } from './status/status';
import type { FieldErrors } from './types';

export interface RefusedRecord {
  id: string;
  error: { code: string; message: string; fields?: FieldErrors };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: FieldErrors,
    /** Ação em conjunto recusada (`refused`): o erro de cada registro barrado. */
    public records?: RefusedRecord[]
  ) {
    super(message);
  }

  /** 503 de sistema fora do ar (`status` do app.json ou proxy): a shell troca a tela por "Em manutenção". */
  offline?: AppStatusDef;
}

interface ErrorBody {
  error?: { code?: string; message?: string; fields?: FieldErrors; records?: RefusedRecord[] };
}

/** O erro de uma resposta não-ok, já com o corpo lido (`null` se não era JSON). */
export function replyError(res: Pick<Response, 'status' | 'headers'>, json: ErrorBody | null): ApiError {
  const err = json?.error;
  const e = new ApiError(res.status, err?.code ?? 'internal', err?.message ?? `Erro ${res.status}.`, err?.fields, err?.records);
  // fora do ar de propósito (motor ou proxy); 503 'unavailable' é só a fonte externa de uma consulta
  if (res.status === 503 && err?.code !== 'unavailable') e.offline = statusFromReply(json, res.headers.get('retry-after'), Date.now());
  return e;
}

/** Falha ao abrir o sistema: o 503 de fora do ar vira a tela de status; o resto, a tela de erro. */
export const loadFailure = (e: unknown): { offline?: AppStatusDef; error?: Error } =>
  e instanceof ApiError && e.offline ? { offline: e.offline } : { error: e as Error };
