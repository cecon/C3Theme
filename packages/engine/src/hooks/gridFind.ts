// Busca e navegação na grade grande do input (contagem de inventário): achar a linha pelo texto e ir para a próxima
// com Enter, como numa planilha.

/** Texto sem acento e em minúsculas, para a busca não depender de "Açúcar" × "acucar". */
// tira o acento: NFD separa a letra da marca, e U+0300–U+036F são as marcas combinantes
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Posições das linhas que casam com a busca (todas as palavras em algum texto da linha). `texts` dá os textos que a
 * linha mostra (o título do reference, a opção do enum, o valor digitado). Busca vazia: todas.
 */
export function matchingRows(count: number, texts: (i: number) => string[], query: string): number[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const all = Array.from({ length: count }, (_, i) => i);
  if (words.length === 0) return all;
  return all.filter((i) => {
    const hay = fold(texts(i).join(' '));
    return words.every((w) => hay.includes(w));
  });
}

/** Próxima linha visível a partir de `row` (Enter desce, Shift+Enter sobe); `undefined` nas pontas. */
export function nextRow(visible: number[], row: number, up: boolean): number | undefined {
  const at = visible.indexOf(row);
  if (at < 0) return undefined;
  return visible[up ? at - 1 : at + 1];
}
