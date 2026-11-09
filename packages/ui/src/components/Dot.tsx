// material-ui
import Box from '@mui/material/Box';

import { toneMain, Tone } from '../theme/soft';

/** Pontinho colorido para legendas, status em listas e indicadores "online". */
export default function Dot({ tone = 'primary', size = 8 }: { tone?: Tone; size?: number }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={(theme) => ({
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: toneMain(theme, tone)
      })}
    />
  );
}
