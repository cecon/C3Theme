// Orientar o turno em andamento (ADR 0008) no agente de exemplo, o mesmo do crates/c3-example (assistant_steer.rs): a
// orientação chega com `steer: 'pending'`, é lida no próximo pedaço da resposta (`steer: 'taken'`) e respondida no
// fim. Sem resposta em andamento, vira mensagem comum com o aviso passageiro. Só a que espera pode ser removida.

import { ApiError, type ChatRoom, type Rec } from '@c3theme/engine-node';

/** Aviso quando não há turno para orientar. */
export const IDLE = 'O agente não estava trabalhando: a mensagem foi como pergunta comum.';

export function steering(all: (r: ChatRoom) => Rec[], key: (r: ChatRoom) => string) {
  const writing = new Set<string>();
  const notes = new Map<string, string[]>();

  /** Lê as orientações que esperam: marca `taken`, avisa a tela e guarda o texto para responder no fim. */
  function take(r: ChatRoom) {
    for (const m of all(r))
      if (m.steer === 'pending') {
        m.steer = 'taken';
        notes.set(key(r), [...(notes.get(key(r)) ?? []), String(m.text)]);
        r.message({ ...m });
      }
  }

  return {
    writing: (r: ChatRoom) => writing.has(key(r)),
    start: (r: ChatRoom) => void writing.add(key(r)),
    take,
    /** No fim da resposta: lê o que ainda esperava e devolve o texto da resposta às orientações lidas (ou nada). */
    finish(r: ChatRoom): string | undefined {
      writing.delete(key(r));
      take(r);
      const list = notes.get(key(r)) ?? [];
      notes.delete(key(r));
      return list.length ? `Anotei e já considerei:\n\n${list.map((n) => `- ${n}`).join('\n')}` : undefined;
    },
    /** Tira a orientação que ainda espera (emite `removed`); lida ou outra mensagem é 409. */
    remove(r: ChatRoom, id: string) {
      const list = all(r);
      const at = list.findIndex((m) => m.id === id);
      if (at < 0) throw ApiError.notFound('Mensagem não encontrada.');
      if (list[at].steer !== 'pending') throw ApiError.conflict('O agente já leu esta mensagem.');
      list.splice(at, 1);
      r.emit({ type: 'removed', id });
    }
  };
}
