// Ações de registro do CRM. Num sistema real, aqui entra o caso de uso (cancelar venda etc.), com a transação e a
// auditoria dele; o `WHERE` de cada UPDATE repete o estado esperado para duas pessoas não agirem ao mesmo tempo.

import { type ActionCall, type ActionOutcome, ApiError, FieldErrors } from '@c3theme/engine-node';

import { type Db, exec } from './db';
import { applyDiscount, duplicateProduct } from './products';

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

const TABLE_MOVES: Record<string, [string, string[], string]> = {
  occupy: ['busy', ['free'], 'Mesa aberta.'],
  ask_bill: ['bill', ['busy'], 'Conta pedida.'],
  release: ['free', ['busy', 'bill', 'blocked'], 'Mesa liberada.']
};

async function moveTable(db: Db, action: string, id: number): Promise<ActionOutcome> {
  const move = TABLE_MOVES[action];
  if (!move) throw ApiError.internal();
  const [to, from, done] = move;
  const sql = `UPDATE dining_table SET status = ? WHERE id = ? AND status IN (${from.map(() => '?').join(', ')})`;
  if ((await exec(db, sql, [to, id, ...from])).rowsAffected === 0)
    throw ApiError.conflict('A mesa mudou de situação enquanto isso. Veja como ela está agora.');
  return { message: done };
}

/** "Trocar certificado": confere que parece um DER (PKCS#12 em base64 começa com "MI") e guarda nome e tamanho. */
async function replaceCertificate(db: Db, call: ActionCall, id: number): Promise<ActionOutcome> {
  const file = (call.input.file ?? {}) as Record<string, unknown>;
  const [name, data] = [str(file.name) ?? '', str(file.data) ?? ''];
  if (!data.startsWith('MI')) {
    const errors = new FieldErrors();
    errors.add('file', 'invalid_certificate', 'O arquivo não é um certificado A1 (.pfx).');
    throw ApiError.validation(errors);
  }
  const size = (data.length / 4) * 3 - (/=*$/.exec(data)?.[0].length ?? 0);
  await exec(db, 'UPDATE company SET certificate = ? WHERE id = ?', [`${name} (${(size / 1024).toFixed(1)} KB)`, id]);
  return { message: 'Certificado trocado.' };
}

const CHURN_REASONS: Record<string, string> = { price: 'Preço', competitor: 'Foi para a concorrência' };

export async function runAction(db: Db, call: ActionCall): Promise<ActionOutcome> {
  const id = Number(call.id);
  switch (`${call.entity}.${call.action}`) {
    case 'company.replace_certificate':
      return replaceCertificate(db, call, id);
    case 'promotion.end': {
      // promoção que ainda não começou termina no próprio início
      const sql = "UPDATE promotion SET status = 'ended', ends_on = max(starts_on, date('now')) WHERE id = ? AND status = 'active'";
      if ((await exec(db, sql, [id])).rowsAffected === 0) throw ApiError.conflict('A promoção já foi encerrada.');
      return {};
    }
    case 'product.duplicate':
      return duplicateProduct(db, id);
    case 'product.discount':
      return applyDiscount(db, call, id);
    case 'customer.churn': {
      const reason = CHURN_REASONS[str(call.input.reason) ?? ''] ?? 'Outro';
      const details = str(call.input.details);
      const text = details !== undefined ? `${reason}: ${details}` : reason;
      await exec(db, "UPDATE customer SET status = 'churned', churn_reason = ? WHERE id = ?", [text, id]);
      return {};
    }
    case 'customer.reactivate':
      await exec(db, "UPDATE customer SET status = 'active', churn_reason = NULL WHERE id = ?", [id]);
      return { message: 'Cliente reativado.' };
    case 'sales_order.cancel': {
      const reason = str(call.input.reason) ?? '';
      if (reason.toLowerCase().includes('teste')) {
        // regra de negócio recusando o input: volta como erro do campo, igual à validação
        const errors = new FieldErrors();
        errors.add('reason', 'pattern', 'Descreva o motivo real do cancelamento.');
        throw ApiError.validation(errors);
      }
      const sql = "UPDATE sales_order SET status = 'canceled', cancel_reason = ? WHERE id = ? AND status = 'open'";
      if ((await exec(db, sql, [reason, id])).rowsAffected === 0) throw ApiError.conflict('O pedido já foi cancelado.');
      return {};
    }
  }
  if (call.entity === 'dining_table') return moveTable(db, call.action, id);
  throw ApiError.internal();
}
