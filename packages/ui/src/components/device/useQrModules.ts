import { useEffect, useMemo, useState } from 'react';

import type { QrModules } from './qr';

// O gerador de QR (qrcode-generator) só baixa quando um QR aparece na tela: quem nunca liga aparelho não leva a
// biblioteca no pedaço de entrada (#121). Carregado uma vez, fica guardado para os próximos QRs.
type Generator = typeof import('./qr');
let loaded: Generator | undefined;
const load = () => import('./qr').then((m) => (loaded = m));

const EMPTY: QrModules = [];

/** Matriz do QR de `value` e o caminho SVG; vazia até o gerador chegar (o quadro branco já ocupa o lugar). */
export function useQrModules(value: string, quiet: number): { modules: QrModules; d: string } {
  const [generator, setGenerator] = useState<Generator | undefined>(loaded);
  useEffect(() => {
    if (generator) return;
    let active = true;
    load()
      .then((m) => active && setGenerator(m))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [generator]);
  return useMemo(() => {
    if (!generator) return { modules: EMPTY, d: '' };
    const modules = generator.qrModules(value);
    return { modules, d: generator.qrPath(modules, quiet) };
  }, [generator, value, quiet]);
}
