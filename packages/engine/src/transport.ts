// Porta de transporte do contrato HTTP (spec/v0/openapi.yaml): quem leva o pedido até o backend. O padrão é o
// `fetch` do navegador; no Electron, o adaptador de @c3theme/electron leva o mesmo pedido por IPC ao processo main.
// Sem React.

/** Mesma forma do `fetch`: o cliente monta o pedido do contrato e lê a `Response`, venha ela de onde vier. */
export type C3Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** O `fetch` global, lido na hora do pedido (teste e polyfill que trocam o global continuam valendo). */
export const browserFetch: C3Fetch = (url, init) => fetch(url, init);
