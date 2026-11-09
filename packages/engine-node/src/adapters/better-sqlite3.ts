// Adaptador do `Store` para better-sqlite3 (o banco do Piecework e do Electron). Uma conexão de leitura e uma de escrita
// sobre o mesmo arquivo em WAL: a leitura nunca vê transação em andamento, e as transações entram uma por vez (fila),
// porque o motor é assíncrono e uma transação pode esperar um hook no meio.

import Database from 'better-sqlite3';

import type { SqlValue } from '../domain/types';
import { type Conn, type Executed, type Row, type Store, StoreError, type Tx } from '../ports/store';
import { sqliteRegexp } from './regexp';

type Db = Database.Database;

export interface BetterSqliteOptions {
  /** Só leitura: liga `PRAGMA query_only` nas duas conexões (motor com `readOnly`). */
  readOnly?: boolean;
}

/** Liga o que o motor exige numa conexão: chaves estrangeiras e `REGEXP`. Para quem abre o banco por conta própria. */
export function prepareConnection(db: Db, readOnly = false): void {
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  if (readOnly) db.pragma('query_only = ON');
  db.function('regexp', { deterministic: true }, (p: unknown, v: unknown) => sqliteRegexp(p, v));
}

function storeError(e: unknown): StoreError {
  const err = e as { code?: string; message?: string };
  const [code, message] = [err.code ?? '', err.message ?? String(e)];
  // o código estendido nem sempre vem (dentro de transação, por exemplo): a mensagem do SQLite decide, como no sqlx
  const kind =
    code.startsWith('SQLITE_CONSTRAINT_UNIQUE') || code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || message.includes('UNIQUE constraint failed')
      ? 'unique'
      : code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || message.includes('FOREIGN KEY constraint failed')
        ? 'foreign_key'
        : 'other';
  return new StoreError(kind, message);
}

/** REAL vira texto; BLOB é erro (o motor só guarda INTEGER e TEXT). */
function cell(v: unknown): SqlValue {
  if (v === null || typeof v === 'string') return v;
  if (typeof v === 'number') return Number.isInteger(v) ? v : String(v);
  if (typeof v === 'bigint') return Number(v);
  throw new StoreError('other', 'coluna BLOB: o motor só lê INTEGER e TEXT');
}

class SyncConn implements Conn {
  constructor(protected readonly db: Db) {}

  query(sql: string, params: readonly SqlValue[] = []): Promise<Row[]> {
    try {
      const st = this.db.prepare(sql);
      if (!st.reader) {
        st.run(...params);
        return Promise.resolve([]);
      }
      return Promise.resolve((st.raw().all(...params) as unknown[][]).map((r) => r.map(cell)));
    } catch (e) {
      return Promise.reject(e instanceof StoreError ? e : storeError(e));
    }
  }

  execute(sql: string, params: readonly SqlValue[] = []): Promise<Executed> {
    try {
      const r = this.db.prepare(sql).run(...params);
      return Promise.resolve({ rowsAffected: r.changes, lastInsertId: Number(r.lastInsertRowid) });
    } catch (e) {
      return Promise.reject(storeError(e));
    }
  }
}

class SyncTx extends SyncConn implements Tx {
  private done = false;

  constructor(
    db: Db,
    private readonly release: () => void
  ) {
    super(db);
  }

  private finish(sql: string): Promise<void> {
    if (this.done) return Promise.resolve();
    this.done = true;
    try {
      this.db.exec(sql);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(storeError(e));
    } finally {
      this.release();
    }
  }

  commit(): Promise<void> {
    return this.finish('COMMIT');
  }

  rollback(): Promise<void> {
    return this.finish('ROLLBACK');
  }
}

export class BetterSqliteStore implements Store {
  private readonly reader: Db;
  private readonly writer: Db;
  private queue: Promise<void> = Promise.resolve();

  /** `file`: caminho do banco (`:memory:` não serve: as duas conexões precisam ver o mesmo arquivo). */
  constructor(file: string, o: BetterSqliteOptions = {}) {
    if (file === ':memory:') throw new Error('BetterSqliteStore precisa de um arquivo (WAL com duas conexões)');
    this.writer = new Database(file);
    this.writer.pragma('journal_mode = WAL');
    prepareConnection(this.writer, o.readOnly);
    this.reader = new Database(file);
    prepareConnection(this.reader, o.readOnly);
  }

  /** A conexão de escrita, para rodar migrations antes de montar o motor. */
  get database(): Db {
    return this.writer;
  }

  conn(): Promise<Conn> {
    return Promise.resolve(new SyncConn(this.reader));
  }

  async begin(): Promise<Tx> {
    let release!: () => void;
    const turn = new Promise<void>((r) => (release = r));
    const previous = this.queue;
    this.queue = previous.then(() => turn);
    await previous;
    try {
      this.writer.exec('BEGIN IMMEDIATE');
    } catch (e) {
      release();
      throw storeError(e);
    }
    return new SyncTx(this.writer, release);
  }

  close(): void {
    this.reader.close();
    this.writer.close();
  }
}
