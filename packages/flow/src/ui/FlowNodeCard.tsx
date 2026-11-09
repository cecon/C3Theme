import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Warning2 } from 'iconsax-reactjs';

import { softColors, StatusChip, toneMain, toneText } from '@c3theme/ui';

import type { NodeRunStatus } from '../core/types';
import { STATUS_TONE, type FlowNodeKind } from './kinds';
import type { FlowText } from './text';

export const NODE_WIDTH = 220;

export interface FlowNodeCardProps {
  name: string;
  kind?: FlowNodeKind;
  summary?: string;
  status?: NodeRunStatus;
  issues: string[];
  selected: boolean;
  t: FlowText;
}

/**
 * Cartão do passo: ícone e tipo, nome, resumo, situação da execução e marca de problema. A borda conta a história:
 * problema em vermelho tracejado, execução na cor da situação, selecionado no primário.
 */
export default function FlowNodeCard({ name, kind, summary, status, issues, selected, t }: FlowNodeCardProps) {
  const live = status && status !== 'idle' ? STATUS_TONE[status] : undefined;
  const tone = kind?.tone ?? 'neutral';
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        width: NODE_WIDTH,
        p: 1.25,
        borderWidth: 2,
        borderStyle: issues.length ? 'dashed' : 'solid',
        borderColor: issues.length
          ? theme.vars.palette.error.main
          : selected
            ? theme.vars.palette.primary.main
            : live
              ? toneMain(theme, live)
              : theme.vars.palette.divider,
        boxShadow: status === 'running' ? `0 0 0 4px color-mix(in srgb, ${theme.vars.palette.primary.main} 18%, transparent)` : 'none'
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            ...softColors(theme, tone),
            width: 28,
            height: 28,
            borderRadius: 1,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            '& svg': { width: 16, height: 16 }
          })}
        >
          {kind?.icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3 }}>
            {kind?.label ?? '?'}
          </Typography>
          <Typography variant="subtitle2" noWrap title={name} sx={{ lineHeight: 1.3 }}>
            {name}
          </Typography>
        </Box>
        {issues.length > 0 && (
          <Box aria-hidden title={issues.join('\n')} sx={(theme) => ({ ...toneText(theme, 'danger'), display: 'flex' })}>
            <Warning2 size={18} variant="Bold" />
          </Box>
        )}
      </Stack>
      {summary && (
        <Typography variant="body2" noWrap title={summary} sx={{ color: 'text.secondary', mt: 0.75 }}>
          {summary}
        </Typography>
      )}
      {(live || issues.length > 0) && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }} useFlexGap>
          {status && live && <StatusChip label={t(`c3.flow.status.${status}`)} tone={live} />}
          {issues.length > 0 && (
            <Typography variant="caption" sx={(theme) => toneText(theme, 'danger')} noWrap title={issues.join('\n')}>
              {issues[0]}
              {issues.length > 1 && ` +${issues.length - 1}`}
            </Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
}
