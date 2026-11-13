// Busca das configurações em modal (#119): acha a linha pelo título e pela descrição, com o título exato na frente.
// Sem React: a caixa de busca fica em SettingsSearchBox.

/** Uma linha que a busca pode encontrar, com onde ela mora. */
export interface SettingsSearchEntry {
  /** id estável da linha (o mesmo do controle) */
  id: string;
  /** título mostrado na linha */
  title: string;
  description?: string;
  /** palavras extras que a linha declara para a busca */
  keywords?: string[];
  /** seção (aba) dona da linha */
  section: string;
  /** subpágina da seção, quando a linha mora nela */
  page?: string;
  /** onde a linha mora, para o resultado: "Notificações" ou "Papéis · Dono" */
  where: string;
}

/** Resultado da busca: a linha e o quanto ela casou (0 é o melhor). */
export interface SettingsSearchHit extends SettingsSearchEntry {
  score: number;
}

/** Sem acento e em minúsculas: "Notificações" acha "notificacoes". */
export function foldSettingsText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function wordsOf(query: string): string[] {
  return foldSettingsText(query)
    .split(/\s+/)
    .filter((word) => word !== '');
}

/**
 * Todos os termos digitados precisam aparecer no título, na descrição ou nas palavras da linha. A melhor nota é:
 * 0 título exato, 1 título começando, 2 título contendo, 3 palavra-chave contendo, 4 descrição contendo. Empate mantém
 * a ordem em que as linhas foram entregues.
 */
function scoreOf(entry: SettingsSearchEntry, words: readonly string[]): number | undefined {
  const title = foldSettingsText(entry.title);
  const description = foldSettingsText(entry.description ?? '');
  const keywords = foldSettingsText((entry.keywords ?? []).join(' '));
  const terms = `${title} ${description} ${keywords}`;
  if (!words.every((word) => terms.includes(word))) {
    return undefined;
  }
  const query = words.join(' ');
  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (words.every((word) => title.includes(word))) return 2;
  if (words.every((word) => keywords.includes(word))) return 3;
  return 4;
}

/** As linhas que casam, da melhor para a pior, limitadas; busca vazia não acha nada. */
export function rankSettings(entries: readonly SettingsSearchEntry[], query: string, limit = 8): SettingsSearchHit[] {
  const words = wordsOf(query);
  if (words.length === 0) return [];
  return entries
    .flatMap((entry) => {
      const score = scoreOf(entry, words);
      return score === undefined ? [] : [{ ...entry, score }];
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}
