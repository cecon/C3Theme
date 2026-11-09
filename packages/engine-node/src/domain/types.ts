// Tipos básicos da spec v0 e do formato trafegado. Sem dependência de banco nem de transporte.

export type FieldType =
  | 'string'
  | 'text'
  | 'email'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  /** Conjunto de opções marcadas, gravado como inteiro: cada opção é um bit (dias da semana 1–127). */
  | 'flags'
  | 'reference'
  /** Arquivo em base64 (`{ name, contentType, data }`); na entidade, a coluna guarda os metadados e grava o sistema. */
  | 'file';

export const FIELD_TYPES: readonly FieldType[] = [
  'string',
  'text',
  'email',
  'integer',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'enum',
  'flags',
  'reference',
  'file'
];

export const isTextual = (t: FieldType): boolean => t === 'string' || t === 'text' || t === 'email';

/** Dono dos registros (spec: `scope`). Só vale quando o app declara `organization`. */
export type Scope = 'group' | 'company' | 'branch';

/** Colunas reservadas do escopo: o backend preenche na criação e nunca muda. */
export const COMPANY_COL = 'org_company_id';
export const BRANCH_COL = 'org_branch_id';

/** Valor de coluna: INTEGER vem number (inteiro), TEXT vem string, NULL vem null. REAL o adaptador entrega como texto. */
export type SqlValue = null | number | string;

/** Objeto JSON no formato trafegado (registro, input, corpo). */
export type Rec = Record<string, unknown>;

/** Maior inteiro que o JavaScript representa sem perder precisão. */
export const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

export const isObject = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Inteiro JSON (como o `as_i64` do serde): número inteiro e seguro. */
export const asInt = (v: unknown): number | undefined => (typeof v === 'number' && Number.isSafeInteger(v) ? v : undefined);

export const asStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** Nome que vira identificador SQL (entre aspas); mesmo assim só o formato da spec. */
export const isIdent = (n: string): boolean => n.length <= 63 && /^[a-z][a-z0-9_]*$/.test(n);

/** Igualdade estrutural de JSON (ordem das chaves não importa). */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => jsonEqual(x, b[i]));
  if (isObject(a) && isObject(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && jsonEqual(a[k], b[k]));
  }
  return false;
}
