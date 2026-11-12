import type { Text } from '../types';

export type PageStateAction = { label: Text } & (
  | { path: string; retry?: never; record?: never }
  | { retry: true; path?: never; record?: never }
  | { record: { entity: string; id: string; action: string }; path?: never; retry?: never }
);
export interface PageStateDef {
  message: Text;
  action?: PageStateAction;
}
export interface PageStates {
  loading: PageStateDef;
  empty: PageStateDef & { action: PageStateAction };
  error: PageStateDef & { action: { label: Text; retry: true } };
  forbidden: PageStateDef & { instruction: Text };
  offline: PageStateDef & { works: Text[] };
}
/** No Electron, a porta informa a conexão com o serviço; o navegador não sabe a situação do IPC. */
export interface ConnectivityPort {
  getOnline(): boolean;
  subscribe(listener: () => void): () => void;
}
export interface PageDataState {
  loading?: boolean;
  empty?: boolean;
  error?: unknown;
  hasData?: boolean;
  retry?: () => void | Promise<unknown>;
}
