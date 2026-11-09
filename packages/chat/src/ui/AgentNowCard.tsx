import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { AgentNowTone } from '../core/agentPanel';
import { PanelLabel } from './AgentPanelSection';

export interface AgentNowCardProps {
  /** Rótulo pequeno: "Fazendo agora", "Esperando", "Parou". */
  label: ReactNode;
  /** A linha de texto: o que o agente faz ou o que espera. */
  children: ReactNode;
  /** Cor semântica (ponto e borda): espera em aviso, erro em vermelho. Padrão: neutro. */
  tone?: AgentNowTone;
  /** Algo à direita do texto (botão "Responder", "Tentar de novo"). */
  action?: ReactNode;
}

const COLOR: Record<AgentNowTone, string | undefined> = {
  neutral: undefined,
  working: 'primary.main',
  waiting: 'warning.main',
  error: 'error.main',
  done: 'success.main'
};

/**
 * Cartão "Fazendo agora" / "Esperando": rótulo pequeno e uma linha de texto. A cor nunca é o único sinal: o rótulo
 * diz o estado; o ponto e a borda só ajudam a achar o cartão que pede atenção.
 */
export default function AgentNowCard({ label, children, tone = 'neutral', action }: AgentNowCardProps) {
  const color = COLOR[tone];
  const alert = tone === 'waiting' || tone === 'error';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.25,
        borderRadius: 2,
        border: 1,
        borderColor: alert ? color : 'divider',
        bgcolor: 'background.paper',
        minWidth: 0
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {color && <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />}
          <PanelLabel component="p">{label}</PanelLabel>
        </Box>
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
          {children}
        </Typography>
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
