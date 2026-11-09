// "Assistente" roteirizado do CRM de exemplo: responde por palavra-chave com as partes do motor (formulário,
// rascunho de cliente, cancelar pedido). Num sistema de verdade isso é o LLM no backend, que confere cada parte com
// Engine::check_agent_part antes de mandar. Aqui só mostra o fluxo inteiro contra a API real do c3-example. Só uma
// parte fica pendente: pedir outra coisa substitui a que estava aberta; "esquece" a cancela (ui.cancel); outro texto
// com uma parte aberta a mantém.

import { memoryTransport, type Message, type PendingPart, type UiAnswer, type UiPart } from '@c3theme/chat';
import { ApiError, type C3Client } from '@c3theme/engine';

export const ME = { id: 'me', name: 'Você' };
const BOT = { id: 'bot', name: 'Assistente' };
export const CONVERSATION = 'demo';
export const SUGGESTIONS = ['Cadastrar a Padaria Bom Dia', 'Cancelar o último pedido', 'Relatório de vendas do mês'];

let seq = 0;
/** Cada envio ganha id próprio: o `ui.cancel` acha a parte pelo id, que precisa ser único na conversa. */
const fresh = (p: UiPart): UiPart => ({ ...p, id: `${p.id}-${++seq}` });
const base = (partId: string) => partId.replace(/-\d+$/, '');
const reply = (text: string, ui?: UiPart[]): Message => ({
  id: `bot-${++seq}`,
  conversationId: CONVERSATION,
  author: BOT,
  direction: 'in',
  format: 'markdown',
  text,
  ui,
  createdAt: new Date().toISOString()
});

const report: UiPart = {
  id: 'periodo',
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
};

const customer: UiPart = {
  id: 'cliente',
  kind: 'c3.record',
  payload: {
    entity: 'customer',
    values: { name: 'Padaria Bom Dia', email: 'contato@padariabomdia.com.br', status: 'lead', credit_limit: '5000.00', vip: false },
    suggested: { email: 'do e-mail que você colou', credit_limit: 'média dos clientes do mesmo porte' }
  }
};

async function lastOrder(client: C3Client): Promise<UiPart | null> {
  const page = await client.list('sales_order', { sort: '-number', pageSize: 10, where: { field: 'status', op: 'eq', value: 'open' } });
  const order = page.data[0];
  if (!order) return null;
  return {
    id: `cancelar-${order.id}`,
    kind: 'c3.action',
    payload: {
      entity: 'sales_order',
      id: String(order.id),
      action: 'cancel',
      input: { reason: 'Cliente desistiu da compra por telefone.' },
      suggested: { reason: 'da sua mensagem' }
    }
  };
}

const AFTER: Record<string, (a: UiAnswer) => string> = {
  periodo: (a) =>
    a.action === 'accept'
      ? `Gerando o relatório de **${String(a.values?.inicio)}** a **${String(a.values?.fim)}**…`
      : 'Tudo bem, fica para depois.',
  cliente: (a) =>
    a.action === 'accept'
      ? `Cliente **${String(a.values?.title)}** cadastrado. Quer abrir um pedido para ele?`
      : a.action === 'undo'
        ? 'Desfeito: o cadastro foi apagado.'
        : 'Ok, não cadastrei.'
};

/**
 * Erro da API vira resposta do assistente, nunca promessa rejeitada solta: sem filial ou sem permissão (403) ele diz
 * o que fazer; o resto mostra a mensagem do servidor.
 */
export function failure(e: unknown, what: string): Message {
  if (e instanceof ApiError && e.status === 403)
    return reply(
      `Você não tem acesso a ${what} na filial atual. Troque de filial no topo da tela ou peça acesso a quem administra o sistema.`
    );
  const detail = e instanceof Error && e.message ? `: ${e.message}` : '.';
  return reply(`Não consegui consultar ${what} agora${detail} Tente de novo em instantes.`);
}

/**
 * Resposta do roteiro para o texto do usuário. Não rejeita: falha da API vira mensagem (ver `failure`). Com uma parte
 * aberta (`pending`), "esquece" a cancela (`cancel`, que vira `ui.cancel`); texto sem pedido novo a mantém.
 */
export async function answerFor(
  raw: string,
  api: C3Client | null,
  pending?: PendingPart,
  cancel?: (partId: string) => void
): Promise<Message> {
  const text = raw.toLowerCase();
  if (pending && /esquec|deixa|não precisa/.test(text)) {
    cancel?.(pending.partId);
    return reply('Tudo bem, deixei esse pedido de lado.');
  }
  if (text.includes('cadastr') || text.includes('cliente'))
    return reply('Montei o cadastro com o que você me passou. Confira o limite de crédito, que eu estimei:', [fresh(customer)]);
  if (text.includes('cancel')) {
    try {
      const part = api && (await lastOrder(api));
      return part
        ? reply('Achei o último pedido em aberto. Cancelar estorna o estoque, então confirme:', [fresh(part)])
        : reply('Não achei pedido em aberto.');
    } catch (e) {
      return failure(e, 'pedidos');
    }
  }
  if (text.includes('relat')) return reply('Claro.', [fresh(report)]);
  // com uma parte aberta, o assistente a mantém (não manda nada sobre ela)
  return pending ? reply('Anotado. O pedido acima continua aberto quando você quiser.') : reply('Claro.', [fresh(report)]);
}

/** Transporte em memória com o roteiro. `client` é a API do motor (para achar o pedido de verdade). */
export function demoAgent(client: () => C3Client | null) {
  const mem = memoryTransport([], {
    latencyMs: 150,
    me: ME,
    onAnswerUi: (conversationId, _m, partId, answer) => {
      const text =
        AFTER[base(partId)]?.(answer) ??
        (answer.action === 'accept' ? `Feito. ${String(answer.values?.message ?? '')}` : 'Ok, não mexi em nada.');
      window.setTimeout(() => mem.emit(conversationId, { type: 'message', message: reply(text) }), 400);
    }
  });
  const send = mem.transport.send;
  mem.transport.send = async (out) => {
    const saved = await send(out);
    window.setTimeout(
      () =>
        void answerFor(out.text ?? '', client(), out.pendingPart, (partId) => mem.cancelUi(out.conversationId, partId)).then((m) =>
          mem.emit(out.conversationId, { type: 'message', message: m })
        ),
      600
    );
    return saved;
  };
  return mem.transport;
}
