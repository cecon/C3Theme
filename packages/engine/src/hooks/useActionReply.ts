import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { download } from '../export';
import type { ActionResult } from '../types';

/** Baixa o arquivo de uma ação `returns: "file"`, se veio um. */
export function saveActionFile(result: ActionResult) {
  if (result.file) download(result.file.name, result.file.blob);
}

/** Abre o endereço de `link` na mesma aba (a porta fica aqui para o teste trocar). */
export const linkPort = { open: (url: string) => window.location.assign(url) };
const openLink = (url: string) => linkPort.open(url);

/**
 * O que a shell faz com a resposta da ação além do aviso: baixa o arquivo, abre o registro de `open`
 * (o rascunho criado a partir do XML) ou o endereço de `link`. Precisa estar dentro do roteador.
 */
export default function useActionReply() {
  const navigate = useNavigate();
  return useCallback(
    (result: ActionResult) => {
      saveActionFile(result);
      if (result.open) navigate(`/${encodeURIComponent(result.open.entity)}/${encodeURIComponent(result.open.id)}`);
      // o motor só deixa passar http(s):// ou caminho do servidor; download com Content-Disposition fica na tela
      else if (result.link) openLink(result.link);
    },
    [navigate]
  );
}
