// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Shortcut, { SUBMIT_LABEL } from '../Shortcut';
import { useChatText } from '../text';

const HIDDEN = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

/** "Ctrl ⏎ orienta o agente sem parar o trabalho": junto da caixa enquanto há turno em andamento (ADR 0008). */
export default function SteerHint() {
  const t = useChatText();
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      component="p"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, mt: 0.5, '& > span': { ml: 0 } }}
    >
      <Shortcut />
      {/* as teclas desenhadas são só visuais: o leitor de tela ouve o nome do atalho */}
      <Box component="span" sx={HIDDEN}>
        {SUBMIT_LABEL}
      </Box>
      {t('c3.chat.steerHint')}
    </Typography>
  );
}
