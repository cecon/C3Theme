// Configuração de registro único (`singleton: true`): um registro por escopo. Criar o segundo é 409; excluir é 405.

import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { BRANCH_COL, COMPANY_COL, type SqlValue } from '../domain/types';
import { type Conn, scalarInt } from '../ports/store';
import type { Owner } from './ctx';

export async function guardSingleton(conn: Conn, entity: Entity, owner: Owner): Promise<void> {
  if (!entity.singleton) return;
  const filters: string[] = [];
  const params: SqlValue[] = [];
  for (const [col, id] of [
    [COMPANY_COL, owner.company],
    [BRANCH_COL, owner.branch]
  ] as const) {
    if (id === undefined) continue;
    filters.push(`"${col}" = ?`);
    params.push(id);
  }
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  if (((await scalarInt(conn, `SELECT COUNT(*) FROM "${entity.name}"${where}`, params)) ?? 0) > 0)
    throw ApiError.conflict('Esta configuração já existe: altere o registro gravado em vez de criar outro.');
}
