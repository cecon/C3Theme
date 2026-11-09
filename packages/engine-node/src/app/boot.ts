// Conferências da subida (`EngineBuilder.build`): a conexão e o banco batem com as entidades, o modo só leitura e
// campo só de escrita ou arquivo tem quem grave.

import type { Children } from '../domain/children-spec';
import { type Entity, titleFieldOf } from '../domain/entity';
import { BRANCH_COL, COMPANY_COL } from '../domain/types';
import { type Conn, type Store, columnTexts, scalarInt } from '../ports/store';
import type { System } from './system';

export function checkHooks(entities: Map<string, Entity>, children: Children, hooks: System, readOnly: boolean): void {
  const names = [...entities.keys()].sort();
  if (readOnly) {
    const own = names.filter((e) => !children.parentOf(e) && !entities.get(e)!.source && !hooks.delegatesWrites(e));
    if (own.length) throw new Error(`modo só leitura: o sistema precisa gravar estas entidades (Hooks.delegatesWrites): ${own.join(', ')}`);
  }
  for (const name of names) {
    const e = entities.get(name)!;
    const ref = e.fields.find((f) => f.reference !== undefined && entities.get(f.reference)?.source);
    if (ref) throw new Error(`${name}.${ref.name}: reference para consulta do sistema (source system) não vale`);
    if (!e.source) continue;
    if (children.parentOf(name)) throw new Error(`${name}: consulta do sistema não pode ser filha with_parent`);
    const a = e.actions.find((x) => !x.list);
    if (a) throw new Error(`${name}.actions.${a.name}: consulta do sistema só tem ação de lista (target 'list')`);
  }
  for (const name of names) {
    const e = entities.get(name)!;
    const f = e.fields.find((x) => x.writeOnly || x.type === 'file');
    if (!f) continue;
    const writer = children.parentOf(name) ?? name;
    const [kind, what] = f.writeOnly ? ['writeOnly', 'senha'] : ['file', 'arquivo'];
    if (f.type === 'file' && writer !== name) throw new Error(`${name}.${f.name}: type file ainda não vale em filha with_parent`);
    if (!hooks.delegatesWrites(writer))
      throw new Error(
        `${name}.${f.name}: campo ${kind} exige escrita delegada (Hooks.delegatesWrites("${writer}")); o motor não grava ${what}`
      );
    if (titleFieldOf(e)?.writeOnly) throw new Error(`${name}: titleField não pode ser writeOnly`);
  }
}

export async function checkDatabase(store: Store, entities: Map<string, Entity>, readOnly: boolean): Promise<void> {
  const conn = await store.conn();
  const regexp = await scalarInt(conn, "SELECT 'Á' REGEXP '(?i)á'").catch(() => null);
  if (regexp !== 1) throw new Error('a conexão não tem REGEXP; use o adaptador do Store (ou registre a função)');
  if ((await scalarInt(conn, 'PRAGMA foreign_keys')) !== 1) throw new Error('PRAGMA foreign_keys está desligado');
  if (readOnly && (await scalarInt(conn, 'PRAGMA query_only')) !== 1)
    throw new Error('modo só leitura com conexão que grava: ligue PRAGMA query_only no adaptador do Store');
  const problems: string[] = [];
  for (const name of [...entities.keys()].sort()) {
    const e = entities.get(name)!;
    if (e.source) continue;
    const columns = await columnTexts(conn, 'SELECT name FROM pragma_table_info(?)', [name]);
    if (!columns.length) {
      problems.push(`tabela '${name}' não existe`);
      continue;
    }
    const reserved = e.scope === 'group' ? [] : e.scope === 'company' ? [COMPANY_COL] : [COMPANY_COL, BRANCH_COL];
    for (const col of ['id', ...reserved, ...e.fields.map((f) => f.name)])
      if (!columns.includes(col)) problems.push(`coluna '${name}.${col}' não existe`);
    problems.push(...(await checkUniqueIndexes(conn, e)));
  }
  if (problems.length) throw new Error(`o banco não bate com as entidades (faltou migration?): ${problems.join('; ')}`);
}

/** Em entidade com escopo, `unique` vale dentro do escopo: precisa de índice único em (coluna do escopo, campo). */
async function checkUniqueIndexes(conn: Conn, entity: Entity): Promise<string[]> {
  if (entity.scope === 'group') return [];
  const col = entity.scope === 'company' ? COMPANY_COL : BRANCH_COL;
  const indexes = await columnTexts(conn, 'SELECT name FROM pragma_index_list(?) WHERE "unique" = 1', [entity.name]);
  const sets: string[] = [];
  for (const idx of indexes) sets.push((await columnTexts(conn, 'SELECT name FROM pragma_index_info(?)', [idx])).sort().join(','));
  return entity.fields
    .filter((f) => f.unique && !sets.includes([col, f.name].sort().join(',')))
    .map((f) => `'${entity.name}.${f.name}' é unique com scope: falta UNIQUE (${col}, ${f.name})`);
}
