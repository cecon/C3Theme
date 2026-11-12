// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, TickCircle } from 'iconsax-reactjs';

import { useChatText } from '../text';
import { secondarySx } from './sx';

export interface ClosedLineProps {
  /** O que foi pedido (nome da ferramenta, título do plano, endereço). */
  title: string;
  /** O que o humano decidiu. Sem isso, a parte fechou sem resposta (o cabeçalho do card já diz o motivo). */
  label?: string;
  tone?: 'success' | 'error';
  reason?: string;
}

/** Resumo de uma decisão já tomada, numa linha (mais o motivo da recusa, se houver). */
export default function ClosedLine({ title, label, tone, reason }: ClosedLineProps) {
  const t = useChatText();
  const color = tone ? `${tone}.main` : 'text.secondary';
  return (
    <Stack spacing={0.5}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, color }}>
        {tone === 'success' && <TickCircle size={18} variant="Bold" color="currentColor" style={{ flexShrink: 0 }} />}
        {tone === 'error' && <CloseCircle size={18} variant="Bold" color="currentColor" style={{ flexShrink: 0 }} />}
        <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 600, flexShrink: 0 }} component="span">
          {label}
        </Typography>
        <Typography variant="body2" noWrap sx={{ color: 'text.secondary', minWidth: 0 }} component="span">
          {title}
        </Typography>
      </Stack>
      {reason && (
        <Typography variant="body2" sx={secondarySx}>
          {t('c3.chat.hitl.reason', { reason })}
        </Typography>
      )}
    </Stack>
  );
}
