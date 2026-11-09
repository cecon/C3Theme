// Acesso ao banco pelos hooks do exemplo: toda escrita numa transação do `Store` (a fila do adaptador garante uma
// por vez); leitura pela conexão de leitura. Como o escritor próprio de um sistema real, mas no mesmo arquivo.

import { type Conn, type Rec, type SqlValue, type Store, type Tx, inTx } from '@c3theme/engine-node';

export interface Db {
  store: Store;
  /** Leitura crua (BLOB incluso), fora do `Store`: o anexo do pedido. */
  readBlob(sql: string, params: SqlValue[]): unknown[] | undefined;
}

/** Um comando avulso, numa transação própria. */
export function exec(db: Db, sql: string, params: SqlValue[] = []): Promise<{ rowsAffected: number; lastInsertId: number }> {
  return inTx(db.store, (tx) => tx.execute(sql, params));
}

export const tx = <T>(db: Db, fn: (t: Tx) => Promise<T>): Promise<T> => inTx(db.store, fn);

export async function rows(conn: Conn | Db, sql: string, params: SqlValue[] = []) {
  const c = 'store' in conn ? await conn.store.conn() : conn;
  return c.query(sql, params);
}

/** Id de um campo reference: no registro validado vem a string do id. */
export function refId(record: Rec, key: string): number | undefined {
  const v = record[key];
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object' && 'id' in v) return refId(v as Rec, 'id');
  return undefined;
}

/** "12.5" → 1250 (decimal com scale 2, já validado pelo motor). */
export function cents(s: unknown): number | undefined {
  if (typeof s !== 'string') return undefined;
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?/.exec(s);
  if (!m) return undefined;
  const v = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0'));
  return m[1] ? -v : v;
}

export const brl = (c: number): string => `R$ ${Math.trunc(c / 100)},${String(Math.abs(c % 100)).padStart(2, '0')}`;
export const decimal = (c: number): string => `${Math.trunc(c / 100)}.${String(Math.abs(c % 100)).padStart(2, '0')}`;
