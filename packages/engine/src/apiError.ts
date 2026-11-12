// Erro do contrato (`{ error: { code, message, fields } }`), com o status HTTP. Sem React.

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
}
