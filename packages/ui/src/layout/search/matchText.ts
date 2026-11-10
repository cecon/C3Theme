// Realce da busca ignorando acentos e caixa: acha o trecho no texto original, mesmo com "pao" contra "Pão".

const fold = (c: string) =>
  c
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Texto sem acento e em minúsculas, para comparar. */
export const normalize = (s: string) => fold(s);

/** Onde `query` aparece em `text` (sem acento e sem caixa), em posições do texto original; sem achado, undefined. */
export function matchRange(text: string, query: string): [number, number] | undefined {
  const q = normalize(query.trim());
  if (!q) return undefined;
  let folded = '';
  const origin: number[] = [];
  Array.from(text).reduce((at, c) => {
    const f = fold(c);
    for (let i = 0; i < f.length; i++) origin.push(at);
    folded += f;
    return at + c.length;
  }, 0);
  const start = folded.indexOf(q);
  if (start < 0) return undefined;
  const lastStart = origin[start + q.length - 1];
  return [origin[start], lastStart + Array.from(text.slice(lastStart))[0].length];
}
