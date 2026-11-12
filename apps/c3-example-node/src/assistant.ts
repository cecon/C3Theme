// Assistente do CRM (spec/v0/chat.yaml), o mesmo do crates/c3-example (assistant.rs): conversas em memória, por
// usuário, com o roteiro de `assistant-script`. A resposta sai aos pedaços (`delta`) e a parte no fim. Só uma parte fica
// pendente: a nova fecha a anterior (`ui.cancel` superseded). Sistema de verdade guarda numa tabela e chama o modelo.

import { ApiError, type Chat, type ChatRoom, type Rec } from '@c3theme/engine-node';

import { after, lastOpenOrder, needsOrder, turn } from './assistant-script';
import type { Db } from './db';
import { user } from './users';

/** Pausa antes de responder e entre os pedaços, para a tela mostrar "pensando" e o texto chegando. */
const THINK = 400;
const CHUNK = 40;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const bot = (id: string, text: string): Rec => ({
  id,
  author: { id: 'bot', name: 'Assistente', kind: 'agent' },
  direction: 'in',
  format: 'markdown',
  text,
  createdAt: now()
});
const parts = (m: Rec) => (Array.isArray(m.ui) ? (m.ui as Rec[]) : []);
const open = (p: Rec) => (p.state ?? 'pending') === 'pending';

export function exampleAssistant(db: Db): Chat {
  const log = new Map<string, Rec[]>();
  const generation = new Map<string, number>();
  let seq = 0;
  const next = (prefix: string) => `${prefix}${++seq}`;
  const key = (r: ChatRoom) => `${r.audience}/${r.conversation}`;
  const all = (r: ChatRoom) => log.get(key(r)) ?? log.set(key(r), []).get(key(r))!;
  const store = (r: ChatRoom, m: Rec) => {
    const list = all(r);
    const i = list.findIndex((x) => x.id === m.id);
    if (i < 0) list.push(m);
    else list[i] = m;
  };
  const pending = (r: ChatRoom) => {
    for (const m of [...all(r)].reverse()) {
      const p = parts(m).find(open);
      if (p) return { messageId: String(m.id), partId: String(p.id) };
    }
    return undefined;
  };
  const findPart = (r: ChatRoom, messageId: string, partId: string) => {
    const m = all(r).find((x) => x.id === messageId);
    return m && { m, p: parts(m).find((x) => x.id === partId) };
  };

  /** Fecha as partes pendentes que sobraram antes da nova (`ui.cancel` superseded). */
  function supersede(r: ChatRoom, keep: string) {
    for (const m of all(r))
      for (const p of parts(m))
        if (p.id !== keep && open(p)) {
          p.state = 'cancelled';
          p.reason = 'superseded';
          r.emit({ type: 'ui.cancel', partId: p.id, reason: 'superseded' });
        }
  }

  /** Escreve a resposta aos pedaços e, no fim, a mensagem inteira com a parte. Parar no meio fecha com o que já foi. */
  async function speak(r: ChatRoom, text: string, part?: Rec) {
    const id = next('bot-');
    const started = generation.get(key(r)) ?? 0;
    r.message({ ...bot(id, ''), streaming: true });
    await sleep(THINK);
    let said = '';
    for (const word of text.split(/(?<= )/)) {
      if ((generation.get(key(r)) ?? 0) !== started) break;
      said += word;
      r.delta(id, word);
      await sleep(CHUNK);
    }
    const done = bot(id, said);
    const partId = next('parte-');
    if (part && said === text) done.ui = [{ ...part, id: partId }];
    r.message(done);
    store(r, done);
    if (done.ui) supersede(r, partId);
  }

  async function sayLater(r: ChatRoom, text: string) {
    await sleep(THINK);
    const m = bot(next('bot-'), text);
    r.message(m);
    store(r, m);
  }

  return {
    audience: (req) => user(req) ?? 'anon',
    history: (r, before, limit) => {
      const list = all(r);
      const found = before === undefined ? -1 : list.findIndex((m) => m.id === before);
      const end = found < 0 ? list.length : found;
      const start = Math.max(0, end - limit);
      return { messages: list.slice(start, end), hasMore: start > 0 };
    },
    send: async (r, m) => {
      const mine = {
        id: next('me-'),
        clientId: m.clientId,
        author: { id: r.audience, name: 'Você' },
        direction: 'out',
        text: m.text,
        status: 'sent',
        createdAt: now()
      };
      store(r, mine);
      const open = pending(r);
      const order = needsOrder(m.text) ? await lastOpenOrder(db) : undefined;
      const t = turn(m.text, open !== undefined, order);
      if ('drop' in t) {
        if (open) {
          Object.assign(findPart(r, open.messageId, open.partId)!.p!, { state: 'cancelled', reason: 'agent' });
          r.emit({ type: 'ui.cancel', partId: open.partId, messageId: open.messageId, reason: 'agent' });
        }
        void sayLater(r, t.drop);
      } else void speak(r, t.say, t.part);
      return mine;
    },
    stop: (r) => void generation.set(key(r), (generation.get(key(r)) ?? 0) + 1),
    answer: () => {
      throw ApiError.notFound('Este assistente não faz perguntas com opções.');
    },
    answerUi: (r, messageId, partId, answer) => {
      const found = findPart(r, messageId, partId);
      if (!found?.p) throw ApiError.notFound('Parte não encontrada.');
      const p = found.p;
      const action = String(answer.action);
      const ok = action === 'undo' ? p.state === 'submitted' : open(p);
      if (!ok) throw ApiError.conflict('Esta pergunta foi substituída ou já foi respondida.');
      if (action !== 'undo' && answer.version !== undefined && answer.version !== p.version)
        throw ApiError.conflict('Esta pergunta mudou depois que você abriu.');
      p.state = { accept: 'submitted', decline: 'declined', undo: 'undone' }[action] ?? 'cancelled';
      r.message(found.m);
      void sayLater(r, after(String(p.kind), answer));
    }
  };
}
