// O pedido e a resposta como atravessam o IPC (structured clone): só texto, números e bytes. Sem Electron.

/** Canais do IPC entre preload e main. */
export const CHANNELS = {
  request: 'c3:request',
  stream: 'c3:stream',
  cancel: 'c3:stream:cancel',
  event: 'c3:stream:event'
} as const;

/** Pedido do contrato. `path` é relativo à API (ex.: `/_meta/app?x=1`): o main decide para onde vai. */
export interface WireRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

export interface WireHead {
  status: number;
  headers: [string, string][];
}

export interface WireResponse extends WireHead {
  body: Uint8Array<ArrayBuffer>;
}

/** O que o main manda num pedido em fluxo (SSE do `live`), na ordem: `head`, `chunk`s, e `end` ou `error`. */
export type StreamEvent =
  | { id: number; type: 'head'; head: WireHead }
  | { id: number; type: 'chunk'; chunk: Uint8Array<ArrayBuffer> }
  | { id: number; type: 'end' }
  | { id: number; type: 'error'; message: string };

/** O que o preload expõe ao renderer (`window.c3` por padrão). */
export interface C3Bridge {
  request(req: WireRequest): Promise<WireResponse>;
  /** Pedido cujo corpo chega aos pedaços. Devolve a função que cancela. */
  stream(req: WireRequest, onEvent: (e: StreamEvent) => void): () => void;
}

const METHODS = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);

/** Cabeçalhos que o renderer pode mandar ao backend (os do contrato); o resto fica no main. */
const HEADERS = new Set(['authorization', 'content-type', 'accept', 'if-match']);
export const allowedHeader = (name: string) => HEADERS.has(name) || name.startsWith('c3-');

const pickHeaders = (headers: Record<string, string>) =>
  Object.fromEntries(Object.entries(headers).flatMap(([k, v]) => (allowedHeader(k.toLowerCase()) ? [[k.toLowerCase(), v]] : [])));

/** O renderer não é confiável para o main: só passa pedido com a forma esperada e os cabeçalhos do contrato. */
export function checkRequest(value: unknown): WireRequest {
  const r = value as Partial<WireRequest> | null;
  const headersOk =
    !!r && typeof r.headers === 'object' && r.headers !== null && Object.values(r.headers).every((v) => typeof v === 'string');
  if (!r || typeof r.method !== 'string' || !METHODS.has(r.method) || typeof r.path !== 'string' || !r.path.startsWith('/') || !headersOk)
    throw new Error('pedido inválido');
  if (r.body !== undefined && typeof r.body !== 'string') throw new Error('pedido inválido: corpo deve ser texto');
  return { method: r.method, path: r.path, headers: pickHeaders(r.headers!), ...(r.body !== undefined && { body: r.body }) };
}
