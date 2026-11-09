// Escritor do operador: o que um sistema faz com um campo `writeOnly`. O motor entrega a senha em texto puro só
// quando chegou uma nova; o hash e a gravação são do sistema. Didático: SHA-256 com sal (em produção, argon2/bcrypt).

import { createHash, randomBytes } from 'node:crypto';

import type { WriteCall } from '@c3theme/engine-node';

import { type Db, tx } from './db';

function hash(password: string): string {
  const salt = randomBytes(8).toString('hex');
  const digest = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return ['sha256', salt, digest].join('$');
}

export function writeOperator(db: Db, call: WriteCall): Promise<number> {
  const text = (k: string) => (typeof call.values[k] === 'string' ? (call.values[k] as string) : null);
  const password = text('password');
  const hashed = password === null ? null : hash(password);
  return tx(db, async (t) => {
    if (call.op === 'create') {
      const sql = 'INSERT INTO operator (name, login, password) VALUES (?, ?, ?)';
      return (await t.execute(sql, [text('name'), text('login'), hashed])).lastInsertId;
    }
    const id = call.id ?? 0;
    if (call.op === 'update')
      // sem senha nova, a gravada fica
      await t.execute('UPDATE operator SET name = ?, login = ?, password = coalesce(?, password) WHERE id = ?', [
        text('name'),
        text('login'),
        hashed,
        id
      ]);
    else await t.execute('DELETE FROM operator WHERE id = ?', [id]);
    return id;
  });
}
