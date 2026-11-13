import type { PageRailItem } from './types';

/** A página continua marcada nos detalhes; filtros específicos vencem a rota sem filtro. */
export function pageRailActive(pages: readonly PageRailItem[], activePath?: string): string | undefined {
  if (!activePath) return;
  const current = new URL(activePath, 'https://c3.invalid');
  let best: { id: string; score: number } | undefined;
  for (const page of pages) {
    const url = new URL(page.url, current);
    if (current.pathname !== url.pathname && !(url.pathname !== '/' && current.pathname.startsWith(url.pathname + '/'))) continue;
    const params = [...url.searchParams];
    if (!params.every(([key, value]) => current.searchParams.get(key) === value)) continue;
    const score = url.pathname.length + params.length;
    if (!best || score > best.score) best = { id: page.id, score };
  }
  return best?.id;
}
