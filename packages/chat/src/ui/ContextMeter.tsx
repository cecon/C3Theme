import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { clampPercent, contextLevel } from '../core/agentPanel';
import { PanelLabel } from './AgentPanelSection';
import { useChatText } from './text';

export interface ContextMeterProps {
  /** Contexto usado, de 0 a 100. */
  used: number;
  /** Porcentagem em que o resumo automático dispara: vira uma marca na barra. */
  summarizeAt?: number;
  /** Rótulo pequeno. Padrão: "Contexto". */
  label?: ReactNode;
  /** Troca o texto de baixo ("62% usado. Resumo automático em 85%."), por exemplo para pôr os tokens. */
  caption?: string;
}

/**
 * Medidor de contexto: barra com a porcentagem usada e a marca do resumo automático. Fica em aviso a 10 pontos do
 * resumo. Quem sabe o número é o servidor; o componente só mostra.
 */
export default function ContextMeter({ used, summarizeAt, label, caption }: ContextMeterProps) {
  const t = useChatText();
  const pct = clampPercent(used);
  const at = summarizeAt === undefined ? undefined : clampPercent(summarizeAt);
  const near = contextLevel(pct, at) === 'near';
  const text =
    caption ?? [t('c3.chat.contextUsed', { used: pct }), at === undefined ? '' : t('c3.chat.contextSummary', { at })].join(' ').trim();
  const name = typeof label === 'string' ? label : t('c3.chat.context');

  return (
    <Box sx={{ p: 1.25, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper', minWidth: 0 }}>
      <PanelLabel component="p">{label ?? t('c3.chat.context')}</PanelLabel>
      <Box
        role="meter"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={text}
        sx={{ position: 'relative', height: 6, my: 0.75, borderRadius: 99, bgcolor: 'divider' }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 99,
            bgcolor: near ? 'warning.main' : 'primary.main',
            transition: 'width .3s',
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
          }}
        />
        {at !== undefined && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: -3,
              bottom: -3,
              left: `${at}%`,
              width: 2,
              ml: '-1px',
              borderRadius: 1,
              bgcolor: 'text.secondary'
            }}
          />
        )}
      </Box>
      <Typography variant="caption" component="p" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {text}
      </Typography>
    </Box>
  );
}
