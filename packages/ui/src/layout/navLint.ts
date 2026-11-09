import type { NavGroup, NavItem } from './nav';

/** Níveis que o menu desenha bem: módulo > seção > tela. Do quarto em diante a shell achata. */
export const MAX_NAV_DEPTH = 3;

export interface NavWarning {
  /** Caminho de títulos até o item, ex.: `Cadastros > Produtos`. */
  path: string;
  message: string;
}

const norm = (s: string) => s.trim().toLocaleLowerCase();

/**
 * Problemas de estrutura que deixam o menu confuso para quem usa. Não bloqueia nada: a shell avisa no
 * console em desenvolvimento e os testes do sistema podem cobrar a lista vazia.
 */
export function lintNav(groups: NavGroup[]): NavWarning[] {
  const out: NavWarning[] = [];
  const titles = new Set(groups.map((g) => (typeof g.title === 'string' ? norm(g.title) : '')).filter(Boolean));

  const walk = (items: NavItem[], trail: string[], depth: number, parent?: NavItem) => {
    for (const item of items) {
      const path = [...trail, item.title].join(' > ');
      const kids = item.children ?? [];
      if (depth > MAX_NAV_DEPTH)
        out.push({ path, message: `nível ${depth}: o menu tem no máximo ${MAX_NAV_DEPTH} (módulo > seção > tela); suba este item` });
      if (parent && norm(parent.title) === norm(item.title))
        out.push({ path, message: 'mesmo nome do pai: quem lê não sabe a diferença; nomeie pela ação (ex.: "Lista", "Ajustar preço")' });
      if (depth === 1 && kids.length && titles.has(norm(item.title)))
        out.push({ path, message: 'mesmo nome de um título de grupo do menu' });
      if (kids.length === 1) out.push({ path, message: 'grupo com um filho só: troque pelo próprio filho, sem o clique a mais' });
      if (kids.length && item.url) out.push({ path, message: 'tem link e filhos: o clique abre o grupo e o link nunca é usado' });
      if (!kids.length && !item.url && item.children) out.push({ path, message: 'grupo vazio' });
      walk(kids, [...trail, item.title], depth + 1, item);
    }
  };
  for (const g of groups) walk(g.items, typeof g.title === 'string' ? [g.title] : [], 1);
  return out;
}

// o bundler do app troca process.env.NODE_ENV pelo valor do build; no navegador sem bundler, não existe
declare const process: { env: { NODE_ENV?: string } };

const warned = new Set<string>();

// escrito por extenso para o bundler trocar pelo literal; com `typeof process` antes, o navegador (sem
// process) nunca via "production" e o aviso saía no site publicado
function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

/** Uma vez por conjunto de problemas (o menu é remontado a cada render), só fora de produção. */
export function warnNav(groups: NavGroup[]) {
  if (isProduction()) return;
  const list = lintNav(groups);
  const text = list.map((w) => `- ${w.path}: ${w.message}`).join('\n');
  if (!list.length || warned.has(text)) return;
  warned.add(text);
  console.warn(`[C3] menu com ${list.length} problema(s):\n${text}`);
}
