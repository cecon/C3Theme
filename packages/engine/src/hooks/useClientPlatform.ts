import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useEngine } from '../context';
import type { ClientPlatform, FormSection } from '../types';

/** Onde a shell roda: o que o app disse (ou desktop pela porta), senão celular em tela estreita e site no resto. */
export default function useClientPlatform(): ClientPlatform {
  const { platform } = useEngine();
  const narrow = useMediaQuery(useTheme().breakpoints.down('sm'), { noSsr: true });
  return platform ?? (narrow ? 'mobile' : 'web');
}

/** Seção sem `platforms` aparece em todas; com, só nas listadas. Só muda a tela, não o que é gravado. */
export const onPlatform = (s: FormSection, p: ClientPlatform) => !s.platforms || s.platforms.includes(p);
