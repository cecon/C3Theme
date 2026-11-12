// Coluna com endereço (`columns[].href`, #69): o valor vira link para outra tela do app, montado pelos campos da linha,
// sem ida ao servidor. Serve à consulta do sistema, cuja linha não abre sozinha (Posição de estoque → kardex).

import { HREF_SLOT } from '../../hrefSlots.mjs';
import type { WireRecord } from '../../types';

/** Só caminho do próprio app: começa com `/` e não com `//` (que seria outro site). */
export const isAppPath = (template: string): boolean => template.startsWith('/') && !template.startsWith('//');

/** O valor do campo no endereço: reference trafega `{ id, title }` e vai o id. */
function slotValue(v: unknown): string | undefined {
  const raw = v && typeof v === 'object' && 'id' in v ? (v as { id: unknown }).id : v;
  return raw === null || raw === undefined || raw === '' ? undefined : String(raw);
}

/** O endereço da linha, com cada `{campo}` trocado pelo valor (codificado); campo vazio: sem link. */
export function fillHref(template: string, row: WireRecord): string | undefined {
  if (!isAppPath(template)) return undefined;
  let missing = false;
  const out = template.replace(HREF_SLOT, (_, name: string) => {
    const v = slotValue(row[name]);
    if (v === undefined) missing = true;
    return encodeURIComponent(v ?? '');
  });
  return missing ? undefined : out;
}
