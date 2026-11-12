// O roteiro do assistente do CRM, o mesmo do crates/c3-example (assistant_script.rs): responde por palavra-chave com
// as partes do motor (formulário do relatório, rascunho de cliente, cancelar o último pedido). Num sistema de verdade
// é o modelo que decide.

import type { Rec } from '@c3theme/engine-node';

import { type Db, rows } from './db';

/** O que o assistente faz com a mensagem: responder (com ou sem parte nova) ou desistir da parte aberta. */
export type Turn = { say: string; part?: Rec } | { drop: string };

const report = (): Rec => ({
  kind: 'c3.form',
  payload: {
    title: 'Para montar o relatório, preciso do período',
    fields: [
      { name: 'inicio', type: 'date', label: 'De', required: true },
      { name: 'fim', type: 'date', label: 'Até', required: true },
      { name: 'cliente', type: 'reference', entity: 'customer', label: 'Só deste cliente', help: 'Vazio: todos.' }
    ],
    rows: [['inicio', 'fim'], ['cliente']],
    values: { inicio: '2026-10-01', fim: '2026-10-31' },
    suggested: { inicio: 'mês passado', fim: 'mês passado' },
    submitLabel: 'Gerar relatório'
  }
});

const customer = (): Rec => ({
  kind: 'c3.record',
  payload: {
    entity: 'customer',
    values: { name: 'Padaria Bom Dia', email: 'contato@padariabomdia.com.br', status: 'lead', credit_limit: '5000.00', vip: false },
    suggested: { email: 'do e-mail que você colou', credit_limit: 'média dos clientes do mesmo porte' }
  }
});

export const cancelOrder = (id: number): Rec => ({
  kind: 'c3.action',
  payload: {
    entity: 'sales_order',
    id: String(id),
    action: 'cancel',
    input: { reason: 'Cliente desistiu da compra por telefone.' },
    suggested: { reason: 'da sua mensagem' }
  }
});

/** O último pedido em aberto (o de maior número). A ação confere a filial e a permissão de quem clicar. */
export async function lastOpenOrder(db: Db): Promise<number | undefined> {
  const [row] = await rows(db, "SELECT id FROM sales_order WHERE status = 'open' ORDER BY number DESC, id DESC LIMIT 1");
  return row === undefined ? undefined : Number(row[0]);
}

/** Pede o último pedido ao banco? Só quando o texto fala em cancelar. */
export function needsOrder(raw: string): boolean {
  const t = raw.toLowerCase();
  return t.includes('cancel') && !t.includes('cadastr') && !t.includes('cliente');
}

/** Para o texto do usuário: com uma parte aberta, "esquece" a cancela e texto sem pedido novo a mantém. */
export function turn(raw: string, pending: boolean, order: number | undefined): Turn {
  const t = raw.toLowerCase();
  if (pending && ['esquec', 'deixa', 'não precisa'].some((k) => t.includes(k))) return { drop: 'Tudo bem, deixei esse pedido de lado.' };
  if (t.includes('cadastr') || t.includes('cliente'))
    return { say: 'Montei o cadastro com o que você me passou. Confira o limite de crédito, que eu estimei:', part: customer() };
  if (t.includes('cancel'))
    return order === undefined
      ? { say: 'Não achei pedido em aberto.' }
      : { say: 'Achei o último pedido em aberto. Cancelar estorna o estoque, então confirme:', part: cancelOrder(order) };
  if (pending && !t.includes('relat')) return { say: 'Anotado. O pedido acima continua aberto quando você quiser.' };
  return { say: 'Claro.', part: report() };
}

/** O que o assistente diz depois que o usuário responde a parte `kind`. */
export function after(kind: string, answer: Rec): string {
  const values = (answer.values ?? {}) as Rec;
  const value = (k: string) =>
    values[k] === undefined ? '' : typeof values[k] === 'string' ? (values[k] as string) : JSON.stringify(values[k]);
  const action = answer.action;
  if (kind === 'c3.form')
    return action === 'accept' ? `Gerando o relatório de **${value('inicio')}** a **${value('fim')}**…` : 'Tudo bem, fica para depois.';
  if (kind === 'c3.record') {
    if (action === 'accept') return `Cliente **${value('title')}** cadastrado. Quer abrir um pedido para ele?`;
    return action === 'undo' ? 'Desfeito: o cadastro foi apagado.' : 'Ok, não cadastrei.';
  }
  return action === 'accept' ? `Feito. ${value('message')}`.trimEnd() : 'Ok, não mexi em nada.';
}
