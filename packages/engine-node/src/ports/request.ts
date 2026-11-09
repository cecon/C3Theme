// O pedido que chega ao motor, neutro de transporte: vem do `node:http`, de um IPC do Electron ou de um teste.

export interface EngineRequest {
  method: string;
  /** Caminho depois do prefixo da API (`/customer/7`), sem a query. */
  path: string;
  /** Query decodificada (`page`, `where`, `p.data`...). */
  query: Record<string, string>;
  /** Cabeçalhos com o nome em minúsculas. */
  headers: Record<string, string | undefined>;
  /** Corpo cru como texto (vazio = sem corpo). */
  body: string;
  /** Do sistema: o usuário que o middleware de autenticação pôs aqui, a sessão. O motor não lê. */
  locals: Record<string, unknown>;
}

/** Resposta do motor. `body` é JSON, bytes de arquivo ou, no tempo real, a sequência de eventos SSE. */
export interface EngineResponse {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  /** Arquivo baixado (download, ação `returns: "file"`). */
  bytes?: Uint8Array;
  /** `GET /{entity}/_events`: cada item é um evento SSE pronto (`event: change\ndata: {...}\n\n`). */
  stream?: AsyncIterable<string>;
}
