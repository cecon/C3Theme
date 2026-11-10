// Liga o transporte ao diálogo (#48): `ask` é estável (o cliente é criado uma vez) e resolve quando a pessoa
// autoriza ou cancela; `dialog` vai na árvore da shell. Sem `app.authorization`, nenhum código é tratado.
import { useCallback, useRef, useState } from 'react';

import AuthorizationDialog, { type AuthorizationConfig } from './AuthorizationDialog';
import type { AskAuthorization, AuthorizationRequest } from './fetch';

export function useAuthorization(config: AuthorizationConfig | undefined) {
  const [request, setRequest] = useState<AuthorizationRequest | null>(null);
  const answer = useRef<(v: Record<string, string> | null) => void>(undefined);
  const latest = useRef(config);
  latest.current = config;

  const ask: AskAuthorization = useCallback(
    (req) =>
      new Promise((resolve) => {
        answer.current = resolve;
        setRequest(req);
      }),
    []
  );
  const codes = useCallback(() => latest.current?.codes ?? [], []);
  const reply = (v: Record<string, string> | null) => {
    setRequest(null);
    answer.current?.(v);
  };
  const dialog = config ? (
    <AuthorizationDialog config={config} request={request} onSubmit={(v) => reply(v)} onCancel={() => reply(null)} />
  ) : null;
  return { ask, codes, dialog };
}
