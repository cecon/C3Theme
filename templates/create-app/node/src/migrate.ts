// Roda as migrations/*.sql em ordem, uma vez cada (registro em `_migrations`). O banco é do sistema: troque por
// outra ferramenta de migration se preferir, o motor só confere as tabelas no boot.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type Database from 'better-sqlite3';

export function migrate(db: Database.Database, dir: string): void {
  db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)');
  const done = new Set(db.prepare('SELECT name FROM _migrations').pluck().all() as string[]);
  for (const name of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    if (done.has(name)) continue;
    db.transaction(() => {
      db.exec(readFileSync(join(dir, name), 'utf8'));
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
    })();
  }
}
