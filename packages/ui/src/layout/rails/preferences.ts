/**
 * Preferências dos rails (#116 e #117) guardadas localmente: ordem dos servidores, servidor local
 * oculto, páginas fixadas e rail recolhido. O motor não guarda nada no servidor; quem chama decide a
 * chave. JSON inválido volta ao padrão, sem quebrar a casca.
 */

export interface RailPreferences {
  /** Ordem escolhida dos servidores, por id. Vazio: ordem declarada. */
  readonly serverOrder: readonly string[];
  /** O servidor local está oculto. */
  readonly localHidden: boolean;
  /** Páginas fixadas no rail; `null` = ainda não escolheu (vale a declaração da spec). */
  readonly pinnedPages: readonly string[] | null;
  /** Rail de páginas recolhido. */
  readonly pagesCollapsed: boolean;
}

export const RAIL_PREFERENCES_PADRAO: RailPreferences = {
  serverOrder: [],
  localHidden: false,
  pinnedPages: null,
  pagesCollapsed: false
};

const SUFIXO = 'c3-theme:rails:v1';

/** Chave de armazenamento de um app. */
export function railStorageKey(appId: string): string {
  return `${SUFIXO}:${appId}`;
}

/** Lê as preferências; qualquer problema volta ao padrão. */
export function readRailPreferences(storage: Pick<Storage, 'getItem'>, key: string): RailPreferences {
  try {
    const bruto = storage.getItem(key);
    if (bruto === null) {
      return RAIL_PREFERENCES_PADRAO;
    }
    const valor: unknown = JSON.parse(bruto);
    if (typeof valor !== 'object' || valor === null) {
      return RAIL_PREFERENCES_PADRAO;
    }
    const registro = valor as Record<string, unknown>;
    const ordem = Array.isArray(registro.serverOrder) ? registro.serverOrder.filter((id): id is string => typeof id === 'string') : [];
    const paginas = Array.isArray(registro.pinnedPages) ? registro.pinnedPages.filter((id): id is string => typeof id === 'string') : null;
    return {
      serverOrder: ordem,
      localHidden: registro.localHidden === true,
      pinnedPages: paginas,
      pagesCollapsed: registro.pagesCollapsed === true
    };
  } catch {
    return RAIL_PREFERENCES_PADRAO;
  }
}

/** Grava as preferências; armazenamento indisponível não derruba a casca. */
export function writeRailPreferences(storage: Pick<Storage, 'setItem'>, key: string, prefs: RailPreferences): void {
  try {
    storage.setItem(key, JSON.stringify(prefs));
  } catch {
    // modo privado ou cota cheia: a preferência vale só nesta sessão
  }
}

/** Aplica a ordem guardada, mantendo ao fim os servidores que ainda não estavam na lista. */
export function ordenarServidores<T extends { readonly id: string }>(servers: readonly T[], ordem: readonly string[]): readonly T[] {
  if (ordem.length === 0) {
    return servers;
  }
  const porId = new Map(servers.map((server) => [server.id, server]));
  const ordenados = ordem.flatMap((id) => {
    const server = porId.get(id);
    if (server === undefined) {
      return [];
    }
    porId.delete(id);
    return [server];
  });
  return [...ordenados, ...porId.values()];
}

/** Move um id uma posição na ordem exibida. */
export function moverNaOrdem(ids: readonly string[], id: string, direcao: -1 | 1): readonly string[] {
  const indice = ids.indexOf(id);
  const destino = indice + direcao;
  if (indice < 0 || destino < 0 || destino >= ids.length) {
    return ids;
  }
  const copia = [...ids];
  [copia[indice], copia[destino]] = [copia[destino] as string, copia[indice] as string];
  return copia;
}

/** Atalho de 1 a 9: devolve a posição pedida, ou nada quando o evento não deve trocar de servidor. */
export function posicaoDoAtalho(evento: KeyboardEvent, plataforma: 'mac' | 'other'): number | undefined {
  if (evento.defaultPrevented || evento.repeat || evento.altKey || evento.shiftKey || evento.isComposing) {
    return undefined;
  }
  const modificador = plataforma === 'mac' ? evento.metaKey : evento.ctrlKey;
  if (!modificador || (plataforma === 'mac' && evento.ctrlKey) || (plataforma !== 'mac' && evento.metaKey)) {
    return undefined;
  }
  const digito = Number.parseInt(evento.key, 10);
  if (!Number.isInteger(digito) || digito < 1 || digito > 9) {
    return undefined;
  }
  const alvo = evento.target;
  if (typeof HTMLElement !== 'undefined' && alvo instanceof HTMLElement) {
    if (alvo.isContentEditable || alvo.getAttribute('contenteditable') !== null || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) {
      return undefined;
    }
  }
  return digito - 1;
}
