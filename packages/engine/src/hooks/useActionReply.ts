import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { download } from '../export';
import type { ActionResult } from '../types';

/** Baixa o arquivo de uma ação `returns: "file"`, se veio um. */
export function saveActionFile(result: ActionResult) {
  if (result.file) download(result.file.name, result.file.blob);
}

/**
 * O que a shell faz com a resposta da ação além do aviso: baixa o arquivo e abre o registro de `open`
 * (o rascunho criado a partir do XML). Precisa estar dentro do roteador.
 */
export default function useActionReply() {
  const navigate = useNavigate();
  return useCallback(
    (result: ActionResult) => {
      saveActionFile(result);
      if (result.open) navigate(`/${encodeURIComponent(result.open.entity)}/${encodeURIComponent(result.open.id)}`);
    },
    [navigate]
  );
}
