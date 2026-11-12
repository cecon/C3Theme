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

/** A resposta do roteiro para o texto do usuário. */
export function answer(conversationId: string, text: string): Message {
  const t = text.toLowerCase();
  if (t.includes('cadastr') || t.includes('cliente'))
    return reply(conversationId, 'Montei o cadastro com o que você me passou. Confira antes de gravar:', [cliente()]);
  return reply(conversationId, 'Claro.', [periodo()]);
}

/** Transporte em memória com o roteiro: responde 300 ms depois de cada envio e de cada resposta de parte. */
export function assistente() {
  const later = (fn: () => void) => window.setTimeout(fn, 300);
  const mem = memoryTransport([], {
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
  mem.transport.send = async (out) => {
    const saved = await send(out);
    later(() => mem.emit(out.conversationId, { type: 'message', message: answer(out.conversationId, out.text ?? '') }));
    return saved;
  };
  return mem.transport;
}
