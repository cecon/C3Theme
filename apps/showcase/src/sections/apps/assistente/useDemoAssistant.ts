import { useEffect, useMemo, useRef, useState } from 'react';

import { memoryTransport, type ChatEvent, type ChatTransport, type Conversation, type Message } from '@c3theme/chat';
import { ANSWERS, FALLBACK, type ScriptedAnswer } from './answers';
import { followUp, QUESTIONS } from './questions';
import streamAnswer from './streamAnswer';

export const ME = { id: 'eu', name: 'Eduardo' };

const FIRST: Conversation = { id: 'a1', title: 'Nova conversa', unread: 0, updatedAt: new Date().toISOString() };

/**
 * O "servidor" do assistente na vitrine: guarda as conversas em memória e responde em pedaços (streaming), com o
 * raciocínio e as ferramentas antes (`streamAnswer`). Num app real, isto é o backend chamando o modelo.
 */
export default function useDemoAssistant() {
  const timers = useRef<number[]>([]);
  const running = useRef<{ conversationId: string; id: string } | null>(null);
  const stop = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const r = running.current;
    if (r) demo.emit(r.conversationId, { type: 'delta', conversationId: r.conversationId, id: r.id, text: '', done: true });
    running.current = null;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const demo = useMemo(() => memoryTransport([], { latencyMs: 150, me: ME, onStop: () => stop() }), []);
  const [conversations, setConversations] = useState<Conversation[]>([FIRST]);
  const [activeId, setActiveId] = useState(FIRST.id);
  const seq = useRef(1);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  /** Responde à pergunta: raciocínio e ferramentas na área de trabalho, depois o texto chegando em pedaços. */
  function answer(conversationId: string, question: string | ScriptedAnswer) {
    stop();
    const script: ScriptedAnswer =
      typeof question !== 'string' ? question : ([...QUESTIONS, ...ANSWERS].find((a) => a.match.test(question)) ?? FALLBACK);
    const emit = (event: ChatEvent) => demo.emit(conversationId, event);
    const id = streamAnswer(conversationId, script, emit, later, () => (running.current = null));
    running.current = { conversationId, id };
  }

  /** Depois do envio: a pergunta vira o título da conversa nova e o assistente responde. */
  function asked(conversationId: string, text: string) {
    setConversations((list) =>
      list
        .map((c) =>
          c.id === conversationId
            ? { ...c, title: c.title === FIRST.title ? text.slice(0, 48) : c.title, updatedAt: new Date().toISOString() }
            : c
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
    answer(conversationId, text);
  }

  /** Gera de novo: apaga a última resposta e responde outra vez à última pergunta. */
  function regenerate(reply: Message) {
    const question = demo.store.filter((m) => m.conversationId === reply.conversationId && m.direction === 'out').at(-1);
    demo.emit(reply.conversationId, { type: 'removed', conversationId: reply.conversationId, id: reply.id });
    if (question?.text) answer(reply.conversationId, question.text);
  }

  function create() {
    stop();
    const id = `a${++seq.current}`;
    setConversations((list) => [{ ...FIRST, id, updatedAt: new Date().toISOString() }, ...list.filter((c) => c.title !== FIRST.title)]);
    setActiveId(id);
  }

  function remove(id: string) {
    stop();
    demo.store.filter((m) => m.conversationId === id).forEach((m) => demo.emit(id, { type: 'removed', conversationId: id, id: m.id }));
    const rest = conversations.filter((c) => c.id !== id);
    if (rest.length === 0) return create();
    setConversations(rest);
    if (id === activeId) setActiveId(rest[0].id);
  }

  function select(id: string) {
    stop();
    setActiveId(id);
  }

  // como no backend de verdade: gravar a pergunta já dispara a resposta
  const onAsked = useRef(asked);
  onAsked.current = asked;
  const onAnswered = useRef(answer);
  onAnswered.current = answer;
  const transport = useMemo<ChatTransport>(
    () => ({
      ...demo.transport,
      async send(out) {
        const saved = await demo.transport.send(out);
        if (out.text) onAsked.current(out.conversationId, out.text);
        return saved;
      },
      // a escolha no card grava na mensagem e o assistente continua a partir dela
      async answer(conversationId, messageId, reply) {
        await new Promise((r) => setTimeout(r, 150));
        const asked = demo.store.find((m) => m.id === messageId);
        if (!asked?.question) return;
        demo.emit(conversationId, { type: 'message', message: { ...asked, question: { ...asked.question, answer: reply } } });
        onAnswered.current(conversationId, followUp(asked.question, reply));
      }
    }),
    [demo]
  );

  return { transport, conversations, activeId, select, create, remove, asked, regenerate };
}
