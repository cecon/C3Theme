// Estados de uma tela que busca dado (issue #99): o que ela diz enquanto carrega, vazia, com erro, sem permissão e sem
// conexão. Declarados no app.json (`$defs/states`, ADR 0010); a regra de qual estado vale fica aqui, sem React.

import { ApiError } from '../apiError';
import type { LinkDef, Text } from '../types';

export interface StatesDef {
  /** O que está sendo carregado, ex.: "Carregando as faturas do mês". */
  loading?: { text: Text };
  /** Sem dado: o recado e o próximo passo. */
  empty?: { text: Text; action?: LinkDef };
  /** Falha ao buscar: a mensagem e o rótulo do "Tentar de novo". */
  error?: { text: Text; retry?: Text };
  /** O usuário não pode ver: o recado, como conseguir a permissão e, se houver, onde pedir. */
  forbidden?: { text: Text; howTo?: Text; action?: LinkDef };
  /** Sem conexão: o recado e o que continua funcionando. */
  offline?: { text: Text; keeps?: Text[] };
}

export type StateKey = keyof StatesDef;

/** Qual estado uma falha de busca mostra: 403 é falta de permissão, status 0 é o pedido que não chegou ao servidor. */
export function stateOfError(e: unknown): 'forbidden' | 'offline' | 'error' {
  if (!(e instanceof ApiError)) return 'error';
  if (e.status === 403) return 'forbidden';
  return e.status === 0 ? 'offline' : 'error';
}

/** O que a sonda da página (`statesEntity`) diz: ainda buscando, a falha, nenhum registro ou pronta para desenhar. */
export type ProbeState = 'loading' | 'ready' | 'empty' | ReturnType<typeof stateOfError>;

export function probeState(probe: { data?: number; error?: unknown }): ProbeState {
  if (probe.error !== undefined) return stateOfError(probe.error);
  if (probe.data === undefined) return 'loading';
  return probe.data > 0 ? 'ready' : 'empty';
}

/** Contagem da resposta de GET /{entity}/_aggregate?measure=count, sem agrupar (texto vira número). */
export const countOf = (items: { value: number | string }[]) => Number(items[0]?.value ?? 0);
