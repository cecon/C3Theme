import { useId, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2, CloseCircle, TickCircle } from 'iconsax-reactjs';

import type { ToolCall } from '../core/types';
import { useDurationFormat } from './format';
import { useChatText } from './text';

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

function StatusIcon({ status }: { status: ToolCall['status'] }) {
  if (status === 'running') return <CircularProgress size={14} thickness={5} aria-hidden />;
  if (status === 'error') return <CloseCircle size={16} variant="Bold" color="currentColor" aria-hidden />;
  return <TickCircle size={16} variant="Bold" color="currentColor" aria-hidden />;
}

export function Payload({ label, text }: { label: string; text: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ fontWeight: 600, mb: 0.25 }}>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1,
          maxHeight: 220,
          overflow: 'auto',
          borderRadius: 1.5,
          bgcolor: 'action.hover',
          fontFamily: mono,
          fontSize: 12,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere'
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

/**
 * Uma etapa do trabalho do assistente (ferramenta): situação, nome, tempo e, se houver, entrada e saída atrás de
 * um clique. Erro já abre aberto, para mostrar o porquê.
 */
export default function ToolStep({ tool, defaultOpen }: { tool: ToolCall; defaultOpen?: boolean }) {
  const t = useChatText();
  const duration = useDurationFormat();
  const name = tool.label ?? tool.name;
  const hasDetails = !!(tool.input || tool.output);
  const [open, setOpen] = useState(defaultOpen ?? tool.status === 'error');
  const detailsId = useId();
  const state = tool.status === 'running' ? t('c3.chat.toolRunning') : tool.status === 'error' ? t('c3.chat.toolError') : undefined;
  const color = tool.status === 'error' ? 'error.main' : tool.status === 'done' ? 'success.main' : 'primary.main';

  const row = (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%', minWidth: 0, py: 0.5 }}>
      <Box sx={{ display: 'flex', width: 16, justifyContent: 'center', color, flexShrink: 0 }}>
        <StatusIcon status={tool.status} />
      </Box>
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, textAlign: 'start' }} title={tool.label ? tool.name : undefined}>
        {name}
        {state && (
          <Typography component="span" variant="caption" color={tool.status === 'error' ? 'error' : 'text.secondary'} sx={{ ml: 0.75 }}>
            {state}
          </Typography>
        )}
      </Typography>
      {tool.durationMs !== undefined && (
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {duration(tool.durationMs)}
        </Typography>
      )}
      {hasDetails && (
        <Box
          component={ArrowDown2}
          size={14}
          aria-hidden
          sx={{ flexShrink: 0, color: 'text.secondary', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      )}
    </Stack>
  );

  if (!hasDetails) return <li>{row}</li>;
  return (
    <li>
      <ButtonBase
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        aria-label={t('c3.chat.details', { name })}
        sx={{ width: '100%', borderRadius: 1, px: 0.5, mx: -0.5, '&:hover': { bgcolor: 'action.hover' } }}
      >
        {row}
      </ButtonBase>
      <Collapse in={open} unmountOnExit>
        <Stack id={detailsId} spacing={1} sx={{ pl: 3, pt: 0.5, pb: 1 }}>
          {tool.input && <Payload label={t('c3.chat.input')} text={tool.input} />}
          {tool.output && <Payload label={t('c3.chat.output')} text={tool.output} />}
        </Stack>
      </Collapse>
    </li>
  );
}
