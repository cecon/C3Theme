// Busca da lista lateral (#135): casa o texto digitado no nome e no resumo (status) do item, sem acento e sem caixa.
import { normalize } from '../search/matchText';
import type { SidebarItem } from './types';

/** Itens cujo nome ou resumo contém `query`; busca vazia devolve a lista inteira, na mesma ordem. */
export function filterItems(items: SidebarItem[], query: string): SidebarItem[] {
  const q = normalize(query.trim());
  if (!q) return items;
  return items.filter((i) => normalize(i.label).includes(q) || (!!i.status && normalize(i.status).includes(q)));
}
