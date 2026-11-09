// Acesso ao banco sem driver no núcleo: o motor gera o SQL (dialeto SQLite) e quem executa é o adaptador que o
// sistema escolhe (`@c3theme/engine-node/better-sqlite3` vem pronto). As conexões precisam de
// `PRAGMA foreign_keys = ON` e da função `REGEXP` (o `build()` confere as duas).

import type { SqlValue } from '../domain/types';

/** Uma linha, na ordem das colunas do SELECT. INTEGER vem número, TEXT vem string; REAL o adaptador entrega como
 * texto e BLOB é erro (o motor só guarda INTEGER e TEXT). */
export type Row = SqlValue[];

export interface Executed {
  rowsAffected: number;
  lastInsertId: number;
}

/** O que o motor precisa saber de um erro do banco: unicidade e chave estrangeira viram 409 do contrato. */
export type StoreErrorKind = 'unique' | 'foreign_key' | 'other';

export class StoreError extends Error {
  readonly kind: StoreErrorKind;

  /** Em unicidade, o motor lê as colunas da mensagem ("UNIQUE constraint failed: t.a, t.b"). */
  constructor(kind: StoreErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/** Uma conexão (ou transação) do adaptador. Parâmetros no lugar de `?`, na ordem. */
export interface Conn {
  query(sql: string, params?: readonly SqlValue[]): Promise<Row[]>;
  execute(sql: string, params?: readonly SqlValue[]): Promise<Executed>;
}

/** Transação `BEGIN IMMEDIATE`. Quem abre fecha: `commit` ou `rollback`. */
export interface Tx extends Conn {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/** O banco do sistema, visto pelo motor. */
export interface Store {
  /** Conexão de leitura, sem transação: enxerga só o que já foi gravado. */
  conn(): Promise<Conn>;
  /** Transação de escrita. Uma por vez: a próxima espera a anterior terminar. */
  begin(): Promise<Tx>;
}

/** Roda `fn` numa transação: grava se terminar, desfaz se lançar. */
export async function inTx<T>(store: Store, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await store.begin();
  try {
    const out = await fn(tx);
    await tx.commit();
    return out;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

/** Coluna `i` como inteiro. Tipo inesperado é erro de banco (500). */
export function intAt(row: Row, i: number): number | null {
  const v = row[i];
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  throw new StoreError('other', `coluna ${i}: esperava INTEGER, veio ${JSON.stringify(v)}`);
}

export function textAt(row: Row, i: number): string | null {
  const v = row[i];
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  throw new StoreError('other', `coluna ${i}: esperava TEXT, veio ${JSON.stringify(v)}`);
}

/** Primeira coluna da primeira linha, como inteiro (COUNT, PRAGMA). */
export async function scalarInt(conn: Conn, sql: string, params: SqlValue[] = []): Promise<number | null> {
  const rows = await conn.query(sql, params);
  return rows.length ? intAt(rows[0], 0) : null;
}

/** Primeira coluna de cada linha, como texto (nomes de colunas e índices). */
export async function columnTexts(conn: Conn, sql: string, params: SqlValue[] = []): Promise<string[]> {
  const out: string[] = [];
  for (const r of await conn.query(sql, params)) {
    const t = textAt(r, 0);
    if (t !== null) out.push(t);
  }
  return out;
}
