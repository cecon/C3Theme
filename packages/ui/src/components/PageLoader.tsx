// material-ui
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import { useUiText } from '../i18n';
import useDelayed from './skeletons/useDelayed';

/**
 * Barra fina no topo da tela enquanto algo carrega sem formato conhecido (código de uma página `lazy()`).
 * Só aparece depois de `delay` ms, para não piscar em carregamentos rápidos.
 */
export default function PageLoader({ delay }: { delay?: number }) {
  const t = useUiText();
  const shown = useDelayed(true, delay);
  if (!shown) return null;
  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.modal + 1 }}>
      <LinearProgress sx={{ height: 3 }} aria-label={t('c3.loading')} />
    </Box>
  );
}
