// Validação de um registro antes de gravar: regras do schema campo a campo, `reference` existente e no escopo do
// dono, `Hooks.validate` e as listas `with_parent`. E a tradução das violações do banco (unique, FK).

import { type Condition, evalCondition } from '../domain/condition';
import { conditionSql } from '../domain/condition-sql';
import { documentError } from '../domain/document';
import { type Entity, fieldOf } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import type { Field } from '../domain/field';
import { isNewFile } from '../domain/file';
import { refCondition } from '../domain/ref-filter';
import { BRANCH_COL, COMPANY_COL, type Rec, type SqlValue, isObject, isTextual } from '../domain/types';
import { isEmpty, toSql, validEmail } from '../domain/value';
import { type Conn, StoreError, intAt } from '../ports/store';
import type { Ctx, Owner } from './ctx';
import { writable } from './read';

/** Reference lido vem { id, title }; para validar e gravar, só o id interessa. */
export function normalizeRefs(entity: Entity, record: Rec): void {
  for (const f of entity.fields) {
    const v = record[f.name];
    if (f.type === 'reference' && isObject(v)) record[f.name] = v.id ?? null;
  }
}

export const isVisible = (entity: Entity, f: Field, record: Rec): boolean =>
  f.visibleWhen === undefined || evalCondition(f.visibleWhen, record, entity);

/**
 * Regras do schema campo a campo (obrigatório, formato, tamanho, faixa, reference existente e no escopo). Também
 * valida o input de uma ação. Num registro que já existe, campo só de escrita vazio mantém o gravado.
 */
export async function checkFields(
  conn: Conn,
  ctx: Ctx,
  entity: Entity,
  owner: Owner,
  record: Rec,
  existing: boolean,
  errors: FieldErrors
): Promise<SqlValue[]> {
  const values: SqlValue[] = [];
  for (const f of writable(entity)) {
    const v = record[f.name];
    const visible = isVisible(entity, f, record);
    // campo escondido não vale nem é guardado
    if (!visible || isEmpty(v)) {
      const when = f.requiredWhen !== undefined && evalCondition(f.requiredWhen, record, entity);
      if (!(existing && f.writeOnly) && (f.required || when) && visible) errors.add(f.name, 'required', 'Campo obrigatório.');
      values.push(null);
      continue;
    }
    // arquivo sem `data` num registro que existe é o gravado (metadados da leitura): fica como está
    if (existing && f.type === 'file' && !isNewFile(v)) {
      values.push(null);
      continue;
    }
    const c = toSql(f, v);
    if (!c.ok) {
      errors.add(f.name, c.error, formatMessage(f, c.error));
      values.push(null);
      continue;
    }
    checkRules(f, c.value, errors);
    if (f.reference !== undefined && typeof c.value === 'number') {
      const target = ctx.engine.entities.get(f.reference)!;
      const filter = refCondition(f, record, target);
      await checkReference(conn, ctx, target, { id: c.value, field: f.name, filter }, owner, errors);
    }
    values.push(c.value);
  }
  return values;
}

interface Picked {
  id: number;
  field: string;
  filter?: Condition;
}

/** O apontado existe no que o usuário enxerga e é compatível com o dono (mesma empresa/filial) e com o `filter`. */
async function checkReference(conn: Conn, ctx: Ctx, target: Entity, p: Picked, owner: Owner, errors: FieldErrors): Promise<void> {
  const scope = ctx.readScope(target, 'r');
  const cols =
    target.scope === 'group'
      ? 'NULL, NULL'
      : target.scope === 'company'
        ? `r."${COMPANY_COL}", NULL`
        : `r."${COMPANY_COL}", r."${BRANCH_COL}"`;
  const params: SqlValue[] = [];
  const allowed = p.filter ? conditionSql(p.filter, 'r', params) : '1';
  params.push(p.id);
  const sql = `SELECT ${cols}, ${allowed} FROM "${target.name}" r WHERE r."id" = ?${scope ? ` AND ${scope}` : ''}`;
  const rows = await conn.query(sql, params);
  if (!rows.length) {
    errors.add(p.field, 'not_found', 'Registro selecionado não existe mais.');
    return;
  }
  const [company, branch] = [intAt(rows[0], 0), intAt(rows[0], 1)];
  const otherCompany = company !== null && owner.company !== undefined && company !== owner.company;
  const otherBranch = branch !== null && owner.branch !== undefined && branch !== owner.branch;
  if (intAt(rows[0], 2) === 0) errors.add(p.field, 'not_allowed', 'Esta opção não vale aqui.');
  else if (otherCompany) errors.add(p.field, 'out_of_scope', 'Este registro é de outra empresa.');
  else if (otherBranch) errors.add(p.field, 'out_of_scope', 'Este registro é de outra filial.');
}

/** Formato e regras de um valor só (sem obrigatório nem reference no banco): origem e retorno de consulta. */
export function checkValue(f: Field, v: unknown, errors: FieldErrors): void {
  const c = toSql(f, v);
  if (!c.ok) errors.add(f.name, c.error, formatMessage(f, c.error));
  else checkRules(f, c.value, errors);
}

function formatMessage(f: Field, code: string): string {
  if (code === 'invalid_option') return 'Opção inválida.';
  if (f.type === 'file') {
    if (code === 'too_large') return `Arquivo maior que ${Math.floor(f.maxSize / 1024)} KB.`;
    if (code === 'file_type') return `Tipo de arquivo não aceito. Use ${f.accept.join(', ')}.`;
    return 'Arquivo vazio ou inválido.';
  }
  switch (f.type) {
    case 'decimal':
      return `Use um número com até ${f.scale} casas decimais.`;
    case 'date':
      return 'Data inválida (AAAA-MM-DD).';
    case 'datetime':
      return 'Data e hora inválidas.';
    case 'integer':
      return 'Use um número inteiro.';
    default:
      return 'Valor inválido.';
  }
}

function checkRules(f: Field, v: SqlValue, errors: FieldErrors): void {
  if (typeof v === 'string' && isTextual(f.type)) {
    const len = [...v].length;
    if (f.minLength !== undefined && len < f.minLength) errors.add(f.name, 'too_short', `Use pelo menos ${f.minLength} caracteres.`);
    if (f.maxLength !== undefined && len > f.maxLength) errors.add(f.name, 'too_long', `Use no máximo ${f.maxLength} caracteres.`);
    if (f.pattern && !f.pattern.test(v)) errors.add(f.name, 'pattern', 'Formato inválido.');
    if (f.type === 'email' && !validEmail(v)) errors.add(f.name, 'pattern', 'E-mail inválido.');
    const code = f.format ? documentError(f.format, v) : undefined;
    if (code !== undefined)
      errors.add(
        f.name,
        code,
        code === 'pattern' ? 'Informe só os números e letras do documento, sem pontuação.' : 'Documento inválido: confira os dígitos.'
      );
  } else if (v === 0 && f.type === 'flags' && f.required) {
    errors.add(f.name, 'required', 'Marque pelo menos uma opção.');
  } else if (typeof v === 'number' && (f.type === 'integer' || f.type === 'decimal')) {
    const x = f.type === 'decimal' ? v / 10 ** f.scale : v;
    if (f.min !== undefined && x < f.min) errors.add(f.name, 'min', `O mínimo é ${f.min}.`);
    if (f.max !== undefined && x > f.max) errors.add(f.name, 'max', `O máximo é ${f.max}.`);
  }
}

/** Traduz violação de constraint do banco em erro do contrato. Outro erro sobe (500). */
export function mapWriteError(e: unknown, entity: Entity): unknown {
  if (!(e instanceof StoreError)) return e;
  if (e.kind === 'foreign_key') return ApiError.conflict('Este registro está ligado a outros e não pode ser alterado assim.');
  if (e.kind !== 'unique') return e;
  // "UNIQUE constraint failed: customer.email" (ou várias colunas separadas por vírgula)
  const fields = new FieldErrors();
  const cols = e.message.split(':').pop() ?? '';
  for (const col of cols.split(',')) {
    const dot = col.trim().indexOf('.');
    const name = dot >= 0 ? col.trim().slice(dot + 1) : '';
    if (dot >= 0 && fieldOf(entity, name)) fields.add(name, 'unique', 'Já existe um registro com este valor.');
  }
  return ApiError.conflict('Já existe um registro com estes dados.', fields);
}
