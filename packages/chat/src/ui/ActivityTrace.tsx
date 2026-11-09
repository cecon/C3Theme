import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';

// third-party
import { ArrowDown2, ExportSquare, Lamp } from 'iconsax-reactjs';

import type { Message } from '../core/types';
import Dots from './Dots';
import { useDurationFormat } from './format';
import { useChatText } from './text';
import ToolStep from './ToolStep';
import { isWorking } from './useWorkTime';

const shimmer = keyframes`from { background-position: 100% 0; } to { background-position: -100% 0; }`;

export interface ActivityTraceProps {
  message: Message;
  /** Tempo de trabalho já medido (`useWorkTime`). */
  workTime?: number;
  /**
   * `inline` (padrão): dentro da resposta, aberto enquanto trabalha e recolhido quando a resposta começa.
   * `panel`: na área de trabalho, sempre aberto e sem limite de altura.
   */
  variant?: 'inline' | 'panel';
  /** Botão para abrir este trabalho na área de trabalho (painel lateral). */
  onOpenWorkspace?: () => void;
}

/** Cabeçalho do trabalho: "Pensando…" brilhando enquanto trabalha; "Pensou por 4 s · 2 etapas" quando acaba. */
function useSummary(m: Message, workTime?: number) {
  const t = useChatText();
  const duration = useDurationFormat();
  if (isWorking(m)) return t('c3.chat.thinking');
  const steps = m.tools?.length ? t('c3.chat.steps', { count: m.tools.length }) : '';
  const head =
    workTime !== undefined
      ? t(m.reasoning ? 'c3.chat.thoughtFor' : 'c3.chat.worked', { time: duration(workTime) })
      : t(m.reasoning ? 'c3.chat.reasoning' : 'c3.chat.activity');
  return steps ? `${head} · ${steps}` : head;
}

/**
 * O que o assistente está pensando e fazendo para responder: o raciocínio chegando ao vivo e as etapas
 * (ferramentas) com situação, tempo, entrada e saída. Some quando a resposta não teve trabalho nenhum.
 */
export default function ActivityTrace({ message: m, workTime, variant = 'inline', onOpenWorkspace }: ActivityTraceProps) {
  const t = useChatText();
  const working = isWorking(m);
  const panel = variant === 'panel';
  const hasBody = !!m.reasoning || !!m.tools?.length;
  const [manual, setManual] = useState<boolean | null>(null);
  const open = panel || (manual ?? working);
  const summary = useSummary(m, workTime);
  const bodyId = useId();
  const reasoningRef = useRef<HTMLDivElement>(null);

  // nova resposta na mesma linha (gerar de novo): volta ao automático
  useEffect(() => setManual(null), [m.id]);

  // raciocínio chegando: acompanha o fim, como quem lê junto
  useLayoutEffect(() => {
    const el = reasoningRef.current;
    if (el && working) el.scrollTop = el.scrollHeight;
  }, [m.reasoning, working]);

  if (!working && !hasBody) return null;

  const label = (
    <Typography
      variant="body2"
      component="span"
      sx={{
        fontWeight: 500,
        color: 'text.secondary',
        ...(working && {
          // "Pensando…" com brilho passando, como nos assistentes de IA
          backgroundImage: (theme) =>
            `linear-gradient(90deg, ${theme.vars.palette.text.secondary} 35%, ${theme.vars.palette.text.primary} 50%, ${theme.vars.palette.text.secondary} 65%)`,
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          color: 'transparent',
          animation: `${shimmer} 1.6s linear infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', color: 'text.secondary', backgroundImage: 'none' }
        })
      }}
    >
      {summary}
    </Typography>
  );

  const icon =
    working && !hasBody ? <Dots /> : <Box component={Lamp} size={16} aria-hidden sx={{ color: 'text.secondary', flexShrink: 0 }} />;

  return (
    <Box sx={{ width: '100%', minWidth: 0 }} role={working ? 'status' : undefined}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        {panel || !hasBody ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.5 }}>
            {icon}
            {label}
          </Stack>
        ) : (
          <ButtonBase
            onClick={() => setManual(!open)}
            aria-expanded={open}
            aria-controls={bodyId}
            sx={{ gap: 1, py: 0.5, px: 0.75, mx: -0.75, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
          >
            {icon}
            {label}
            <Box
              component={ArrowDown2}
              size={14}
              aria-hidden
              sx={{ color: 'text.secondary', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </ButtonBase>
        )}
        {onOpenWorkspace && hasBody && (
          <Tooltip title={t('c3.chat.openWorkspace')}>
            <IconButton size="small" aria-label={t('c3.chat.openWorkspace')} onClick={onOpenWorkspace} sx={{ color: 'text.secondary' }}>
              <ExportSquare size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {hasBody && (
        <Collapse in={open}>
          <Stack id={bodyId} spacing={1} sx={{ pl: 1, ml: 0.75, mt: 0.5, borderInlineStart: 2, borderColor: 'divider' }}>
            {m.reasoning && (
              <Typography
                ref={reasoningRef}
                variant="body2"
                component="div"
                color="text.secondary"
                aria-label={t('c3.chat.reasoning')}
                sx={{ pl: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', ...(!panel && { maxHeight: 180, overflowY: 'auto' }) }}
              >
                {m.reasoning}
              </Typography>
            )}
            {m.tools && m.tools.length > 0 && (
              <Box component="ol" sx={{ listStyle: 'none', m: 0, pl: 1 }}>
                {m.tools.map((tool) => (
                  <ToolStep key={tool.id} tool={tool} />
                ))}
              </Box>
            )}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
}
