// Adaptador de repasse: o main manda o pedido do renderer a um backend HTTP (servidor remoto ou binário local).
// O pedido sai do main, não da página: não há CORS, e o renderer só alcança caminhos dentro da API.

import type { C3Handler } from './serve';

export interface ForwardOptions {
  /** Padrão: o `fetch` do Node (ou o `net.fetch` do Electron, se o app quiser o proxy do sistema). */
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  /** Cabeçalhos que o main acrescenta (ex.: chave do dispositivo), por cima dos do renderer. */
  headers?: () => Record<string, string>;
}

/** Repassa a `apiUrl` (ex.: `https://erp.exemplo.com/api` ou `http://127.0.0.1:3000/api`). */
export function forwardTo(apiUrl: string | (() => string), opts: ForwardOptions = {}): C3Handler {
  const send = opts.fetch ?? ((url, init) => fetch(url, init));
  return (req, signal) => {
    const url = resolveInside(typeof apiUrl === 'function' ? apiUrl() : apiUrl, req.path);
    const headers = { ...req.headers, ...opts.headers?.() };
    return send(url, { method: req.method, headers, body: req.body, signal });
  };
}

/** `base` + `path`, recusando o que sairia da API (`..`, `%2e%2e`, outro host). */
export function resolveInside(base: string, path: string): string {
  const root = new URL(base.endsWith('/') ? base : `${base}/`);
  const url = new URL(path.replace(/^\/+/, ''), root);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) throw new Error(`caminho fora da API: ${path}`);
  return url.href;
}
