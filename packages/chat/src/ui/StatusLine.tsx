import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export interface StatusItem {
  id: string;
  icon?: ReactNode;
  /** O texto já formatado pelo app ("41 turnos · 232 tok/s", "367 mi tokens"). */
  label: ReactNode;
  /** Explicação ao passar o mouse. */
  title?: string;
}

export interface StatusLineProps {
  items: StatusItem[];
  /** Progresso de 0 a 100 (contexto usado, tarefa): círculo com o número. */
  progress?: number;
  /** Nome do progresso para leitor de tela e dica ("Contexto usado"). */
  progressLabel?: string;
}

/**
 * Linha de status embaixo da caixa: turnos, tokens, cache, progresso. Quem sabe os números é o servidor; o
 * componente só mostra o que receber, sem formatar nem calcular nada.
 */
export default function StatusLine({ items, progress, progressLabel }: StatusLineProps) {
  if (!items.length && progress === undefined) return null;
  const pct = progress === undefined ? undefined : Math.round(Math.min(100, Math.max(0, progress)));
  return (
    <Stack
      direction="row"
      role="status"
      sx={{ justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, color: 'text.secondary' }}
    >
      {items.map((it) => (
        <Tooltip key={it.id} title={it.title ?? ''} disableHoverListener={!it.title}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
            {it.icon && (
              <Box component="span" aria-hidden sx={{ display: 'inline-flex', '& svg': { width: 14, height: 14 } }}>
                {it.icon}
              </Box>
            )}
            <Typography variant="caption" sx={{ color: 'inherit', fontVariantNumeric: 'tabular-nums' }}>
              {it.label}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
      {pct !== undefined && (
        <Tooltip title={progressLabel ?? ''} disableHoverListener={!progressLabel}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress variant="determinate" value={100} size={14} thickness={6} sx={{ color: 'divider' }} aria-hidden />
              <CircularProgress
                variant="determinate"
                value={pct}
                size={14}
                thickness={6}
                aria-label={progressLabel}
                sx={{ position: 'absolute', inset: 0, color: pct >= 90 ? 'warning.main' : 'primary.main' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'inherit', fontVariantNumeric: 'tabular-nums' }}>
              {pct}%
            </Typography>
          </Stack>
        </Tooltip>
      )}
    </Stack>
  );
}
