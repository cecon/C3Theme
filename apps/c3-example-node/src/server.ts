// CRM de exemplo da spec (spec/v0/examples) montado sobre o @c3theme/engine-node: o mesmo de crates/c3-example, para a
// suíte de conformidade rodar contra o backend Node (pelo main.ts ou em processo, no conformance.test.ts).

import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

import { buildEngine, engineListener } from '@c3theme/engine-node';
import { BetterSqliteStore } from '@c3theme/engine-node/better-sqlite3';
import Database from 'better-sqlite3';

import type { Db } from './db';
import { exampleHooks } from './hooks';
import { loginRoute } from './login';
import { exampleNotifications } from './notifications';
import { exampleSearch } from './search';

/** Raiz do repositório (migrations do exemplo em Rust e a spec de exemplo). */
const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
const ENTITIES = [
  'company',
  'customer',
  'org_company',
  'branch',
  'seller',
  'sales_order',
  'company_contact',
  'sales_order_item',
  'company_fiscal',
  'operator',
  'permission',
  'role',
  'role_permission',
  'activity',
  'dining_table',
  'product',
  'question',
  'question_option',
  'product_question',
  'promotion',
  'promotion_product',
  'store_settings',
  'system_param',
  'customer_pending',
  'request_log'
];

/** As migrations do exemplo em Rust, em ordem, uma vez cada (o sqlx guarda em `_sqlx_migrations`; aqui, `_migrations`). */
function migrate(db: Database.Database, root: string): void {
  const MIGRATIONS = join(root, 'crates/c3-example/migrations');
  db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)');
  const done = new Set(db.prepare('SELECT name FROM _migrations').pluck().all() as string[]);
  for (const name of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    if (done.has(name)) continue;
    db.transaction(() => {
      db.exec(readFileSync(join(MIGRATIONS, name), 'utf8'));
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
    })();
  }
}

const spec = (root: string, name: string) => readFileSync(join(root, 'spec/v0/examples', `${name}.json`), 'utf8');

/**
 * Migra o banco do arquivo `file` e devolve o servidor HTTP do exemplo (ainda sem ouvir), com a API em `/api`. `root`
 * é a raiz do repositório; quem roda no navegador de teste (jsdom, onde `import.meta.url` não é arquivo) passa a sua.
 */
export async function exampleServer(file: string, root = REPO_ROOT): Promise<{ server: Server; close: () => void }> {
  const store = new BetterSqliteStore(file);
  migrate(store.database, root);
  // o anexo do pedido é BLOB, que o `Store` não trafega: leitura crua numa conexão só de leitura
  const raw = new Database(file, { readonly: true });
  const db: Db = {
    store,
    readBlob: (sql, params) =>
      raw
        .prepare(sql)
        .raw()
        .get(...params) as unknown[] | undefined
  };
  // o banco das requisições (`store: "logs"` em request_log.json), num arquivo ao lado, refeito a cada subida
  for (const ext of ['', '-wal', '-shm']) rmSync(`${file}-logs${ext}`, { force: true });
  const logs = new BetterSqliteStore(`${file}-logs`);
  logs.database.exec(readFileSync(join(root, 'crates/c3-example/logs.sql'), 'utf8'));
  const engine = await buildEngine({
    store,
    stores: { logs },
    app: spec(root, 'app'),
    entities: ENTITIES.map((e) => spec(root, e)),
    hooks: exampleHooks(db),
    notifications: exampleNotifications(),
    search: exampleSearch(db)
  });
  const server = createServer(engineListener(engine, { prefix: '/api', routes: loginRoute }));
  return {
    server,
    close: () => {
      server.close();
      raw.close();
      store.close();
      logs.close();
    }
  };
}
