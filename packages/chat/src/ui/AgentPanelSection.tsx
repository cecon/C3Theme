import { useId, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface AgentPanelSectionProps {
  /** Rótulo pequeno em caixa alta ("O que fez", "Arquivos recentes"). */
  title: ReactNode;
  /** Algo à direita do rótulo (contagem, botão pequeno). */
  end?: ReactNode;
  /** Nível do título na página onde o app monta o painel. Padrão: `h3`. */
  headingComponent?: PanelHeading;
  children: ReactNode;
}

export type PanelHeading = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/** Rótulo pequeno do painel do agente, em caixa alta e cor secundária. */
export function PanelLabel({ children, id, component = 'h3' }: { children: ReactNode; id?: string; component?: PanelHeading | 'p' }) {
  return (
    <Typography
      id={id}
      component={component}
      variant="caption"
      sx={{ m: 0, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'text.secondary', lineHeight: 1.6 }}
    >
      {children}
    </Typography>
  );
}

/** Seção do painel do agente: rótulo e conteúdo, com o rótulo dando nome à região para leitor de tela. */
export default function AgentPanelSection({ title, end, headingComponent, children }: AgentPanelSectionProps) {
  const id = useId();
  return (
    <Box component="section" aria-labelledby={id} sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <PanelLabel id={id} component={headingComponent}>
          {title}
        </PanelLabel>
        {end}
      </Box>
      {children}
    </Box>
  );
}
