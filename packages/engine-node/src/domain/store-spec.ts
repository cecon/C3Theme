// Entidade lida de outro banco (`"store": "requisicoes"`): o sistema passa os bancos a mais em `stores` e a lista, a
// busca, os filtros, os totais e o registro aberto leem dali, iguais. O motor só lê desse banco: gravação é 405, e
// sem ação, filha nem reference (o título de um reference é um JOIN, que não cruza bancos). Mesmas regras do c3-engine.

import type { Entity } from './entity';
import { ApiError } from './errors';

/** O que a entidade de outro banco não pode ter, porque o motor só lê dali e não junta bancos. */
export function checkStoreEntity(e: Entity): void {
  const store = e.store;
  if (store === undefined) return;
  const bad = (why: string) => new Error(`${e.name}.store '${store}': ${why}`);
  if (!/^[a-z0-9_]+$/.test(store)) throw bad('nome do banco em minúsculas, dígitos e _');
  if (e.source || e.singleton || e.actions.length) throw bad('só leitura: sem source, singleton nem ações');
  if (e.scope !== 'group') throw bad("scope 'group' (empresa e filial moram no banco do app)");
  const f = e.fields.find((x) => x.type === 'reference' || x.type === 'file');
  if (f) throw bad(`campo '${f.name}': reference e file não cruzam bancos`);
}

/** Cada `store` citado precisa estar registrado, e ninguém aponta para uma entidade de outro banco. */
export function checkStores(entities: Map<string, Entity>, stores: ReadonlySet<string>): void {
  for (const e of entities.values()) {
    if (e.store !== undefined && !stores.has(e.store)) throw new Error(`${e.name}.store '${e.store}': banco não registrado (stores)`);
    for (const f of e.fields)
      if (f.reference !== undefined && entities.get(f.reference)?.store !== undefined)
        throw new Error(`${e.name}.${f.name}: '${f.reference}' é lida de outro banco e não pode ser referenciada`);
  }
}

/** Gravação numa entidade de outro banco: 405, o motor só lê dali. */
export function guardWrites(e: Entity): void {
  if (e.store !== undefined) throw ApiError.methodNotAllowed('Lida de outro banco: só leitura.');
}
