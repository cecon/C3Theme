import { useEffect, useState } from 'react';

import type { C3Icons } from '../context';

/**
 * Catálogo de ícones da shell: o do sistema, se ele passou; senão o iconsax inteiro, carregado à parte
 * (vários MB) para não pesar no pedaço principal.
 */
export default function useIconCatalog(icons: C3Icons | undefined): C3Icons | undefined {
  const [catalog, setCatalog] = useState<C3Icons | undefined>(icons);

  useEffect(() => {
    if (icons) return setCatalog(icons);
    let active = true;
    import('iconsax-reactjs').then((m) => active && setCatalog(m as unknown as C3Icons)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [icons]);

  return catalog;
}
