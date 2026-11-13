import type { C3Icons } from '../context';

/**
 * Só o catálogo fornecido pelo sistema. Sem catálogo, os rótulos continuam e o ícone é omitido.
 * O catálogo completo é opt-in em @c3theme/engine/icones-completos; nunca importado pela shell.
 */
export default function useIconCatalog(icons: C3Icons | undefined): C3Icons | undefined {
  return icons;
}
