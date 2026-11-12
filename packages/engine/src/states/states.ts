// Estados declarados na spec (`$defs/states`): o texto e a ação que a pessoa vê quando a tela carrega, está vazia,
// falhou, foi negada ou ficou sem rede. Puro: classifica o erro e diz o que mostrar.

import { ApiError } from '../apiError';
import type { LinkDef, Text } from '../types';

export interface StatesDef {
  loading?: { text: Text };
  empty?: { text: Text; action?: LinkDef };
  error?: { text: Text; retry?: Text };
  forbidden?: { text: Text; howTo?: Text; action?: LinkDef };
  offline?: { text: Text; keeps?: Text[] };
}

export type StateKey = keyof StatesDef;

/** Erro de uma rota em estado: 403 é sem permissão, status 0 (rede) é offline e o resto (5xx, 4xx) é erro. */
export function stateOfError(e: unknown): 'forbidden' | 'offline' | 'error' {
  if (e instanceof ApiError && e.status === 403) return 'forbidden';
  if (e instanceof ApiError && e.status === 0) return 'offline';
  return 'error';
}
