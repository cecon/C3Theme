import { useEffect, useMemo, useRef, useState } from 'react';

import { memoryTransport, type Conversation } from '@c3theme/chat';
import { AUTO_REPLIES, CONTACTS, INITIAL_UNREAD, ME, SEED_MESSAGES } from './data';

/**
 * O "servidor" da demonstração: transporte em memória com o histórico inicial, respostas automáticas com
 * "digitando…" e a lista de conversas (última mensagem e não lidas). Num app real, isto é o backend.
 */
export default function useDemoChat(activeId: string) {
  const demo = useMemo(() => memoryTransport(SEED_MESSAGES, { latencyMs: 300, me: { id: ME.id, name: ME.name } }), []);
  const [unread, setUnread] = useState<Record<string, number>>(INITIAL_UNREAD);
  const [tick, setTick] = useState(0);
  const active = useRef(activeId);
  const replies = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    active.current = activeId;
    setUnread((u) => ({ ...u, [activeId]: 0 }));
  }, [activeId]);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  // qualquer mensagem nova (minha ou resposta) reordena a lista
  useEffect(() => {
    const stops = CONTACTS.map((c) => demo.transport.subscribe(c.id, (e) => e.type !== 'typing' && setTick((n) => n + 1)));
    return () => stops.forEach((s) => s());
  }, [demo]);

  /** Depois do meu envio: o contato "digita" e responde (menos quem está offline). */
  function autoReply(contactId: string) {
    const contact = CONTACTS.find((c) => c.id === contactId)!;
    if (contact.presence === 'offline') return;
    const author = { id: contact.id, name: contact.name };
    timers.current.push(
      window.setTimeout(() => demo.emit(contactId, { type: 'typing', conversationId: contactId, author, typing: true }), 700),
      window.setTimeout(() => {
        demo.emit(contactId, { type: 'typing', conversationId: contactId, author, typing: false });
        demo.emit(contactId, {
          type: 'message',
          message: {
            id: `r-${Date.now()}`,
            conversationId: contactId,
            author,
            direction: 'in',
            text: AUTO_REPLIES[replies.current++ % AUTO_REPLIES.length],
            createdAt: new Date().toISOString()
          }
        });
        if (active.current !== contactId) setUnread((u) => ({ ...u, [contactId]: (u[contactId] ?? 0) + 1 }));
      }, 2200)
    );
  }

  /** Apaga a conversa no "servidor"; a janela aberta recebe as remoções. */
  function clear(contactId: string) {
    demo.store
      .filter((m) => m.conversationId === contactId)
      .forEach((m) => demo.emit(contactId, { type: 'removed', conversationId: contactId, id: m.id }));
  }

  const conversations = useMemo<Conversation[]>(() => {
    void tick;
    return CONTACTS.map((c) => {
      const last = demo.store.filter((m) => m.conversationId === c.id).at(-1);
      return { id: c.id, title: c.name, subtitle: c.role, unread: unread[c.id] ?? 0, lastMessage: last, updatedAt: last?.createdAt ?? '' };
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [demo, unread, tick]);

  return { transport: demo.transport, conversations, autoReply, clear };
}
