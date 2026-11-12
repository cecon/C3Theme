// Estados declarados do chat (`$defs/chat.states`, ADR 0011) sobre a janela de mensagens. Puro: diz o que cobre o
// painel, o que vai na faixa acima da conversa e o que ocupa o lugar da conversa vazia.

import type { ChatTransport } from '@c3theme/chat';

import { stateOfError, type StatesDef } from '../states/states';

/** Falha da última chamada às rotas /_chat: null quando a última deu certo. */
export type ChatFailure = ReturnType<typeof stateOfError> | null;

export interface ChatStateInput {
  /** Abrindo a conversa (primeira página do histórico). */
  loading: boolean;
  failure: ChatFailure;
  online: boolean;
  /** Mensagens já carregadas. */
  count: number;
}

export interface ChatStates {
  /** Troca o painel inteiro: sem permissão não há o que mostrar. */
  cover: 'forbidden' | null;
  /** Faixa acima da conversa, com o histórico visível. */
  banner: 'offline' | 'error' | null;
  /** No lugar da conversa vazia. */
  slot: 'loading' | 'empty' | 'offline' | 'error' | null;
}

const NONE: ChatStates = { cover: null, banner: null, slot: null };

/** Sem `states`, nada muda. Só sai estado declarado; o que não foi declarado fica como o painel já mostra. */
export function chatStates(states: StatesDef | undefined, s: ChatStateInput): ChatStates {
  if (!states) return NONE;
  if (s.failure === 'forbidden' && states.forbidden) return { ...NONE, cover: 'forbidden' };
  const problem = !s.online || s.failure === 'offline' ? 'offline' : s.failure === 'error' ? 'error' : null;
  if (problem && states[problem]) return s.count > 0 ? { ...NONE, banner: problem } : { ...NONE, slot: problem };
  if (s.count > 0) return NONE;
  if (s.loading) return { ...NONE, slot: states.loading ? 'loading' : null };
  return { ...NONE, slot: !problem && s.failure === null && states.empty ? 'empty' : null };
}

/** Conta ao painel como terminou cada abertura e envio: falha classificada ou null quando deu certo. */
export function watchFailures(transport: ChatTransport, onResult: (failure: ChatFailure) => void): ChatTransport {
  const watch = <T>(work: Promise<T>) =>
    work.then(
      (value) => {
        onResult(null);
        return value;
      },
      (e: unknown) => {
        // fechar o painel aborta a abertura: não é falha de ninguém
        if ((e as { name?: unknown } | null)?.name !== 'AbortError') onResult(stateOfError(e));
        throw e;
      }
    );
  return {
    ...transport,
    loadMessages: (...args) => watch(transport.loadMessages(...args)),
    send: (...args) => watch(transport.send(...args))
  };
}
