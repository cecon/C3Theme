// O resto dos hooks do CRM: faturar pedidos juntos (`bulk: "together"`), consultas de CEP/CNPJ (`lookups`), a consulta
// do sistema (`source: system`) e o anexo do pedido (download).

import {
  type ActionOutcome,
  ApiError,
  type BulkActionCall,
  type FileCall,
  type FileContent,
  type LookupCall,
  type Preview,
  type PreviewCall,
  type Rec,
  type SourceCall,
  type SourceSql,
  type SqlValue
} from '@c3theme/engine-node';

import { type Db, brl, exec, tx } from './db';

export function invoicePreview(call: PreviewCall): Preview {
  const n = call.ids.length;
  const what = `${n} pedido${n === 1 ? '' : 's'}`;
  const due = call.input.due_date;
  return {
    message: typeof due === 'string' ? `Uma fatura com ${what}, vencimento em ${due}.` : `Uma fatura com ${what}. Informe o vencimento.`
  };
}

/** Uma fatura só com a soma dos pedidos; confere de novo na transação (outro usuário pode ter faturado um no meio). */
export function invoice(db: Db, call: BulkActionCall): Promise<ActionOutcome> {
  const due = call.input.due_date;
  if (typeof due !== 'string') throw ApiError.internal();
  const ids = call.ids.map(Number);
  return tx(db, async (t) => {
    let total = 0;
    let owner: SqlValue | undefined;
    for (const id of ids) {
      const sql = "SELECT org_company_id, total FROM sales_order WHERE id = ? AND status = 'open' AND invoice IS NULL";
      const [row] = await t.query(sql, [id]);
      if (!row) throw ApiError.conflict('Um dos pedidos foi faturado ou cancelado enquanto isso. Nada foi faturado; atualize a lista.');
      if (owner !== undefined && owner !== row[0]) throw ApiError.conflict('Uma fatura junta pedidos de uma empresa só.');
      owner = row[0];
      total += Number(row[1] ?? 0);
    }
    const sql = 'INSERT INTO invoice (org_company_id, total, due_date, orders) VALUES (?, ?, ?, ?)';
    const number = (await t.execute(sql, [owner ?? null, total, due, ids.length])).lastInsertId;
    for (const id of ids) await t.execute('UPDATE sales_order SET invoice = ? WHERE id = ?', [number, id]);
    return { message: `Fatura ${number}: ${ids.length} pedido${ids.length === 1 ? '' : 's'}, ${brl(total)}.` };
  });
}

/** Tabela fixa no lugar do ViaCEP e da Receita, para a suíte ver os três desfechos (achou, não achou, fora do ar). */
export function lookup(call: LookupCall): Rec {
  const key = `${call.lookup}:${call.value}`;
  switch (key) {
    case 'cep:01310100':
      return { street: 'Avenida Paulista', city: 'São Paulo', state: 'SP' };
    case 'cep:99999999':
      throw ApiError.unavailable('Consulta de CEP fora do ar. Preencha à mão.');
    case 'sintegra:110042490114': // filha with_parent: vale a permissão do pai
      return { tax_regime: 'presumido' };
    case 'cnpj:11222333000181':
      return { trade_name: 'Empresa Exemplo' };
    case 'cnpj:11444777000161': // campo fora de fills: a suíte confere que o motor barra
      return { certificate: 'x' };
    default:
      throw ApiError.notFound('Nada encontrado para este valor.');
  }
}

/** Atividades em aberto de cada cliente até `until`; atrasada = prazo antes da data pedida. */
export function source(call: SourceCall): SourceSql {
  if (call.entity !== 'customer_pending') throw ApiError.internal();
  const until = typeof call.params.until === 'string' ? call.params.until : '';
  let sql =
    'SELECT a.customer_id AS id, a.customer_id, COUNT(*) AS open_count, SUM(CASE WHEN a.due_date < ? THEN 1 ELSE 0 END) AS late_count, ' +
    "MIN(a.due_date) AS oldest_due FROM activity a WHERE a.customer_id IS NOT NULL AND a.due_date <= ? AND a.stage IN ('todo', 'doing')";
  const values: SqlValue[] = [until, until];
  if (typeof call.params.stage === 'string') {
    sql += ' AND a.stage = ?';
    values.push(call.params.stage);
  }
  return { sql: `${sql} GROUP BY a.customer_id`, values };
}

/**
 * Adiar as pendências dos clientes marcados (`customer_pending.postpone`, em conjunto sobre a consulta): só as
 * atividades que entram na posição consultada, com os mesmos parâmetros da lista na tela.
 */
export async function postpone(db: Db, call: BulkActionCall): Promise<ActionOutcome> {
  const days = Number(call.input.days);
  const until = typeof call.params.until === 'string' ? call.params.until : '';
  const stage = typeof call.params.stage === 'string' ? call.params.stage : undefined;
  let done = 0;
  for (const id of call.ids) {
    const sql =
      "UPDATE activity SET due_date = date(due_date, ?) WHERE customer_id = ? AND due_date <= ? AND stage IN ('todo', 'doing')" +
      (stage ? ' AND stage = ?' : '');
    const values: SqlValue[] = [`+${days} days`, Number(id), until, ...(stage ? [stage] : [])];
    done += (await exec(db, sql, values)).rowsAffected;
  }
  return { message: `${done} atividade(s) adiada(s) em ${days} dia(s).` };
}

export function readAttachment(db: Db, call: FileCall): FileContent {
  const sql = 'SELECT o.attachment, f.data FROM sales_order o JOIN sales_order_file f ON f.order_id = o.id WHERE o.id = ?';
  const row = db.readBlob(sql, [Number(call.id)]);
  if (!row) throw ApiError.notFound('Sem arquivo.');
  let meta: Rec;
  try {
    meta = JSON.parse(String(row[0])) as Rec;
  } catch {
    throw ApiError.internal();
  }
  return {
    name: typeof meta.name === 'string' ? meta.name : 'arquivo',
    contentType: typeof meta.contentType === 'string' ? meta.contentType : undefined,
    data: new Uint8Array(row[1] as Buffer)
  };
}
