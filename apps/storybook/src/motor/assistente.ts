// O agente das histórias, no lugar das rotas /_chat do backend: responde por palavra-chave com as partes do motor
// sobre a spec do Storybook (rascunho de cliente, período do relatório). Num sistema de verdade é o backend
// (porta Chat) que responde, e a shell fala com ele pelo /_chat.

import { memoryTransport, type Message, type UiPart } from '@c3theme/chat';

const BOT = { id: 'bot', name: 'Assistente', kind: 'agent' as const };
let seq = 0;

const reply = (conversationId: string, text: string, ui?: UiPart[]): Message => ({
  id: `bot-${++seq}`,
  conversationId,
  author: BOT,
  direction: 'in',
  format: 'markdown',
  text,
  ui,
  createdAt: new Date().toISOString()
});

const cliente = (): UiPart => ({
  id: `cliente-${++seq}`,
  kind: 'c3.record',
  payload: {
    entity: 'cliente',
    values: { nome: 'Padaria Bom Dia', email: 'contato@padariabomdia.com.br', cidade: 'Campinas', uf: 'SP', status: 'ativo' },
    suggested: { email: 'do e-mail que você colou', cidade: 'do CEP da mensagem' }
  }
});

const periodo = (): UiPart => ({
  id: `periodo-${++seq}`,
  kind: 'c3.form',
  payload: {
    title: 'Para montar o relatório, preciso do período',
    fields: [
      { name: 'inicio', type: 'date', label: 'De', required: true },
      { name: 'fim', type: 'date', label: 'Até', required: true }
    ],
    rows: [['inicio', 'fim']],
    values: { inicio: '2026-10-01', fim: '2026-10-31' },
    suggested: { inicio: 'mês passado', fim: 'mês passado' },
    submitLabel: 'Gerar relatório'
  }
});

/** Histórico das conversas por pedido (`/conversa/:conversation`, ADR 0009): cada id da rota abre a sua. */
const HISTORICO: Message[] = [
  reply('pedido-1042', 'O pedido 1042 saiu para entrega hoje às 9h. A nota já foi emitida.'),
  reply('pedido-1043', 'O pedido 1043 espera o pagamento do boleto, que vence amanhã.')
];

/** A resposta do roteiro para o texto do usuário. */
export function answer(conversationId: string, text: string): Message {
  const t = text.toLowerCase();
  if (t.includes('cadastr') || t.includes('cliente'))
    return reply(conversationId, 'Montei o cadastro com o que você me passou. Confira antes de gravar:', [cliente()]);
  return reply(conversationId, 'Claro.', [periodo()]);
}

/** Texto da pesquisa longa: dá tempo de orientar o agente (ADR 0008) enquanto ele escreve. */
export const PESQUISA =
  'Estou levantando as faturas em aberto, cliente por cliente, e cruzando com os pagamentos do mês para ver quem atrasou ' +
  'e quanto. Depois separo por faixa de atraso e por valor, para você decidir a ordem da cobrança.';

/**
 * Transporte em memória com o roteiro: responde 300 ms depois de cada envio e de cada resposta de parte. "Pesquisar…"
 * escreve aos pedaços por uns segundos; a orientação mandada nesse meio é lida no pedaço seguinte (`steer: taken`) e
 * respondida no fim. Orientação sem trabalho em andamento vira mensagem comum, com o aviso passageiro.
 */
export function assistente() {
  const later = (fn: () => void) => window.setTimeout(fn, 300);
  const mem = memoryTransport(HISTORICO, {
    latencyMs: 100,
    me: { id: 'me', name: 'Você' },
    onAnswerUi: (conversationId, _m, _p, a) =>
      later(() =>
        mem.emit(conversationId, {
          type: 'message',
          message: reply(conversationId, a.action === 'accept' ? 'Feito. Gravei pelo cadastro de sempre.' : 'Tudo bem, fica para depois.')
        })
      )
  });
  const send = mem.transport.send;
  const writing = new Set<string>();
  const notes: string[] = [];
  /** Lê as orientações que esperam: marca `taken` e guarda o texto para responder no fim. */
  const take = (conversationId: string) =>
    mem.store
      .filter((m) => m.conversationId === conversationId && m.steer === 'pending')
      .forEach((m) => {
        notes.push(m.text ?? '');
        mem.emit(conversationId, { type: 'message', message: { ...m, steer: 'taken' } });
      });
  /** Escreve a pesquisa aos pedaços; no fim, responde as orientações lidas. */
  const research = (conversationId: string) => {
    writing.add(conversationId);
    later(() => write(conversationId));
  };
  const write = (conversationId: string) => {
    const first = reply(conversationId, '');
    const words = PESQUISA.split(/(?<= )/);
    mem.emit(conversationId, { type: 'message', message: { ...first, streaming: true } });
    words.forEach((word, i) =>
      window.setTimeout(
        () => {
          take(conversationId);
          mem.emit(conversationId, { type: 'delta', conversationId, id: first.id, text: word, done: i === words.length - 1 });
          if (i < words.length - 1) return;
          writing.delete(conversationId);
          const said = notes.splice(0).map((n) => `- ${n}`);
          if (said.length)
            mem.emit(conversationId, { type: 'message', message: reply(conversationId, `Anotei e já considerei:\n\n${said.join('\n')}`) });
        },
        400 + i * 120
      )
    );
  };
  mem.transport.send = async (out) => {
    const idle = !writing.has(out.conversationId);
    const saved = await send({ ...out, steer: out.steer && !idle });
    if (out.steer && !idle) return saved;
    if (out.steer)
      mem.emit(out.conversationId, {
        type: 'notice',
        conversationId: out.conversationId,
        text: 'O agente já tinha terminado: a mensagem foi como pergunta comum.'
      });
    if ((out.text ?? '').toLowerCase().includes('pesquis')) research(out.conversationId);
    else later(() => mem.emit(out.conversationId, { type: 'message', message: answer(out.conversationId, out.text ?? '') }));
    return saved;
  };
  return mem.transport;
}
