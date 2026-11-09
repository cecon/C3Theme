import { useEffect, useState } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Maximize4, Minus, Moon, Sun1 } from 'iconsax-reactjs';
import { useUiText } from '../i18n';
import useColorMode from '../theme/useColorMode';

/** Liga e desliga a tela cheia do navegador. */
export function FullscreenButton() {
  const t = useUiText();
  const [full, setFull] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);
  useEffect(() => {
    const sync = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  if (typeof document !== 'undefined' && !document.fullscreenEnabled) return null;
  return (
    <Tooltip title={t(full ? 'c3.fullscreen.exit' : 'c3.fullscreen.enter')}>
      <IconButton
        aria-label={t('c3.fullscreen.enter')}
        onClick={() => (full ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}
      >
        {full ? <Minus size={20} /> : <Maximize4 size={20} />}
      </IconButton>
    </Tooltip>
  );
}

/** Alterna entre claro e escuro. O padrão segue o sistema operacional até o usuário escolher. */
export function ColorModeButton() {
  const t = useUiText();
  const { mode, toggle } = useColorMode();
  const dark = mode === 'dark';
  return (
    <Tooltip title={t(dark ? 'c3.mode.toLight' : 'c3.mode.toDark')}>
      <IconButton aria-label={t('c3.mode.toggle')} onClick={toggle}>
        {dark ? <Sun1 size={20} /> : <Moon size={20} />}
      </IconButton>
    </Tooltip>
  );
}
