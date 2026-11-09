// Regras do cardápio (spec/v0/examples: product, question, promotion e os filhos with_parent). As de um registro só
// ficam em `validate`; as que comparam as linhas da lista, em `validateChildren`.

import type { ChildWrite, Conn, FieldErrors, Rec } from '@c3theme/engine-node';

import { refId } from './db';

const int = (r: Rec, k: string): number | undefined => (typeof r[k] === 'number' ? (r[k] as number) : undefined);
const text = (r: Rec, k: string): string | undefined => (typeof r[k] === 'string' && r[k] !== '' ? (r[k] as string) : undefined);

/** Regras de um registro (pai ou uma linha filha). */
export async function validateMenu(entity: string, record: Rec, conn: Conn, errors: FieldErrors): Promise<void> {
  if (entity === 'question') {
    const [min, max] = [int(record, 'min_choices'), int(record, 'max_choices')];
    if (text(record, 'choice') === 'single' && max !== 1) errors.add('max_choices', 'max', 'Com uma opção, o máximo é 1.');
    else if (min !== undefined && max !== undefined && min > max) errors.add('min_choices', 'max', 'Mín. não pode ser maior que máx.');
  } else if (entity === 'product_question') {
    const question = refId(record, 'question_id');
    if (question === undefined) return;
    if (refId(record, 'depends_on_id') === question)
      errors.add('depends_on_id', 'invalid_option', 'A pergunta não pode depender dela mesma.');
    const rows = await conn
      .query(
        'SELECT q.min_choices, q.max_choices, ' +
          '(SELECT COUNT(*) FROM question_option o WHERE o.question_id = q.id AND o.active = 1) FROM question q WHERE q.id = ?',
        [question]
      )
      .catch(() => []);
    if (!rows.length) return;
    const col = (i: number) => (typeof rows[0][i] === 'number' ? (rows[0][i] as number) : undefined);
    // vazio no produto: vale o da pergunta
    const min = int(record, 'min_choices') ?? col(0) ?? 0;
    const max = int(record, 'max_choices') ?? col(1) ?? 1;
    const options = col(2) ?? 0;
    if (min > max) errors.add('min_choices', 'max', 'Mín. não pode ser maior que máx.');
    if (max > options) errors.add('max_choices', 'max', `Máx. não pode passar do número de opções ativas da pergunta (${options}).`);
  } else if (entity === 'promotion') {
    const [buy, pay] = [int(record, 'buy'), int(record, 'pay')];
    if (buy !== undefined && pay !== undefined && pay >= buy) errors.add('pay', 'max', 'O pague precisa ser menor que o leve.');
    const [start, end] = [text(record, 'starts_on'), text(record, 'ends_on')];
    if (start !== undefined && end !== undefined && end < start) errors.add('ends_on', 'min', 'O fim não pode ser antes do início.');
    const [from, to] = [text(record, 'from_time'), text(record, 'to_time')];
    if (from !== undefined && to !== undefined && to <= from)
      errors.add('to_time', 'min', 'O horário final precisa ser depois do inicial.');
  }
}

/** Linhas que ficam na lista (as excluídas saem), com a posição enviada. */
function kept(children: ChildWrite[], entity: string): [number, Rec][] | undefined {
  const list = children.find((c) => c.entity === entity);
  if (!list) return undefined;
  return list.rows.filter((r) => r.op !== 'delete' && r.index !== undefined).map((r) => [r.index!, r.values]);
}

/** Regras entre as linhas da lista e o pai. */
export function validateMenuChildren(entity: string, record: Rec, children: ChildWrite[], errors: FieldErrors): void {
  if (entity === 'question') {
    // o máximo da pergunta contra as opções ativas da lista enviada
    const rows = kept(children, 'question_option');
    if (!rows) return;
    const active = rows.filter(([, r]) => r.active !== false).length;
    const max = int(record, 'max_choices');
    if (max !== undefined && max > active) errors.add('max_choices', 'max', `Máx. não pode passar do número de opções ativas (${active}).`);
  } else if (entity === 'product') {
    // "libera depois de" aponta para uma pergunta deste produto com ordem menor
    const rows = kept(children, 'product_question');
    if (!rows) return;
    for (const [i, row] of rows) {
      const dep = refId(row, 'depends_on_id');
      if (dep === undefined) continue;
      const position = int(row, 'position') ?? 0;
      const before = rows.some(([, o]) => refId(o, 'question_id') === dep && (int(o, 'position') ?? 0) < position);
      if (!before)
        errors.add(`product_question.${i}.depends_on_id`, 'invalid_option', 'Precisa ser uma pergunta deste produto com ordem menor.');
    }
  }
}
