// Autorização de outro usuário (#48, `app.authorization`): o servidor recusa com um código declarado
// (`orcamento_excedido`), a shell pede usuário, senha e motivo de quem pode liberar e reenvia o MESMO pedido com o
// cabeçalho `C3-Authorization` (JSON em base64, UTF-8). Fica no transporte: vale para criar, alterar, excluir e
// toda ação, e a senha nunca passa pelo formulário nem pelo rascunho. Sem React.

import type { C3Fetch } from '../transport';

export const AUTHORIZATION_HEADER = 'c3-authorization';

export interface AuthorizationRequest {
  code: string;
  /** Mensagem do servidor na primeira recusa (o que precisa de liberação). */
  message: string;
  /** Recusa da tentativa anterior (senha errada, sem permissão), mostrada no próprio diálogo. */
  error?: string;
}

/** Abre o diálogo e devolve os valores digitados, ou `null` se a pessoa cancelou. */
export type AskAuthorization = (req: AuthorizationRequest) => Promise<Record<string, string> | null>;

/** Os valores no cabeçalho: JSON em UTF-8, em base64 (cabeçalho HTTP só leva ASCII). */
export function encodeAuthorization(values: Record<string, string>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(values));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
}

/** Código e mensagem do erro do contrato (`{ error: { code, message } }`), sem consumir a resposta. */
async function errorOf(res: Response): Promise<{ code: string; message: string } | undefined> {
  if (res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
  const body = await res
    .clone()
    .json()
    .catch(() => null);
  const err = body?.error;
  return typeof err?.code === 'string' ? { code: err.code, message: String(err.message ?? '') } : undefined;
}

/**
 * Transporte que trata a recusa com código de `codes()`: pergunta (`ask`) e reenvia com o cabeçalho. Nova recusa
 * do mesmo tipo, 401 ou 403 volta ao diálogo com a mensagem; cancelar devolve a recusa original à tela.
 */
export function authorizingFetch(fetch: C3Fetch, codes: () => string[], ask: AskAuthorization): C3Fetch {
  return async (url, init) => {
    const res = await fetch(url, init);
    const first = await errorOf(res);
    if (!first || !codes().includes(first.code)) return res;
    let error: string | undefined;
    for (;;) {
      const values = await ask({ code: first.code, message: first.message, error });
      if (!values) return res;
      const headers = { ...Object.fromEntries(new Headers(init?.headers)), [AUTHORIZATION_HEADER]: encodeAuthorization(values) };
      const retry = await fetch(url, { ...init, headers });
      const again = await errorOf(retry);
      if (!again || !(codes().includes(again.code) || retry.status === 401 || retry.status === 403)) return retry;
      error = again.message || `Erro ${retry.status}.`;
    }
  };
}
