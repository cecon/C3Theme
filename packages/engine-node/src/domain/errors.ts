// Formato de erro único do contrato (spec/README.md#erros).

export interface FieldError {
  code: string;
  message: string;
}

/** Erros por campo; a resposta sai com os nomes em ordem (estável para teste). */
export class FieldErrors {
  private readonly map = new Map<string, FieldError[]>();

  add(field: string, code: string, message: string): void {
    const list = this.map.get(field) ?? [];
    list.push({ code, message });
    this.map.set(field, list);
  }

  has(field: string): boolean {
    return this.map.has(field);
  }

  isEmpty(): boolean {
    return this.map.size === 0;
  }

  /** Fica só com os erros cujo código passa; campo sem erro sai. */
  retain(keep: (code: string) => boolean): void {
    for (const [k, list] of this.map) {
      const kept = list.filter((e) => keep(e.code));
      if (kept.length) this.map.set(k, kept);
      else this.map.delete(k);
    }
  }

  remove(field: string): void {
    this.map.delete(field);
  }

  /** Junta os erros de uma linha filha com o prefixo dela (`items.2.` + `ean`). */
  absorb(prefix: string, other: FieldErrors): void {
    for (const [k, list] of other.map) {
      const key = prefix + k;
      this.map.set(key, [...(this.map.get(key) ?? []), ...list]);
    }
  }

  toJSON(): Record<string, FieldError[]> {
    const out: Record<string, FieldError[]> = {};
    for (const k of [...this.map.keys()].sort()) out[k] = this.map.get(k)!;
    return out;
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  fields?: FieldErrors;
  /** Ação em conjunto recusada: o erro de cada registro barrado, na ordem dos ids (`records` na resposta). */
  records: [string, ApiError][] = [];

  constructor(status: number, code: string, message: string, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, 'bad_request', message);
  }

  static forbidden(message = 'Você não tem permissão para esta ação.'): ApiError {
    return new ApiError(403, 'forbidden', message);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, 'not_found', message);
  }

  static conflict(message: string, fields?: FieldErrors): ApiError {
    return new ApiError(409, 'conflict', message, fields);
  }

  /** Operação que a entidade não tem (excluir uma configuração `singleton`): 405. */
  static methodNotAllowed(message: string): ApiError {
    return new ApiError(405, 'method_not_allowed', message);
  }

  /** `If-Match` com uma versão que não é mais a do registro: alguém gravou no meio. 412, nada muda. */
  static stale(): ApiError {
    return new ApiError(412, 'stale', 'Este registro mudou depois que você o abriu. Recarregue para ver como ele está.');
  }

  static validation(fields: FieldErrors): ApiError {
    return new ApiError(422, 'validation_failed', 'Alguns campos precisam de atenção.', fields);
  }

  /** Ação em conjunto (`bulk: "together"`) com registros barrados: 409 e nada roda. */
  static refused(total: number, records: [string, ApiError][]): ApiError {
    const n = records.length;
    const message =
      n === total
        ? 'Nada foi feito: nenhum dos registros marcados aceita esta ação.'
        : `Nada foi feito: ${n} dos ${total} registros marcados não aceita${n === 1 ? '' : 'm'} esta ação.`;
    const e = new ApiError(409, 'refused', message);
    e.records = records;
    return e;
  }

  /** Fonte externa fora do ar ou lenta demais (consulta de CEP/CNPJ): 503, a tela segue sem preencher. */
  static unavailable(message: string): ApiError {
    return new ApiError(503, 'unavailable', message);
  }

  static internal(): ApiError {
    return new ApiError(500, 'internal', 'Algo deu errado. Tente de novo em instantes.');
  }

  /** `{ code, message, fields? }`: o `error` da resposta (e de cada item que falhou numa ação em lote). */
  body(): Record<string, unknown> {
    const out: Record<string, unknown> = { code: this.code, message: this.message };
    if (this.fields) out.fields = this.fields.toJSON();
    if (this.records.length) out.records = this.records.map(([id, e]) => ({ id, error: e.body() }));
    return out;
  }
}

/** Erro do sistema (hook que lançou algo que não é `ApiError`): vai para o log, o cliente recebe 500. */
export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  console.error('c3-engine-node: erro inesperado:', e);
  return ApiError.internal();
}
