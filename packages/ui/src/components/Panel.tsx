import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

export interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Botões ou links à direita do título. */
  action?: ReactNode;
  /** Sem padding no corpo: para tabelas e listas que vão de borda a borda. */
  flush?: boolean;
  /**
   * Ações do rodapé (botões de "Ver relatório", "Exportar"...). Ficam presas embaixo: quando o card estica para a
   * altura da linha, o espaço sobra entre o conteúdo e o rodapé, e não abaixo dos botões.
   */
  footer?: ReactNode;
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

// cantos do tema × 3 no visual da C3; tema de cantos retos (Angle, 4px) fica com o canto do tema, como o .card dele
const panelRadius = (theme: Theme) => {
  const r = Number(theme.shape.borderRadius);
  return `${r >= 8 ? r * 3 : r}px`;
};

/** Bloco de conteúdo com título opcional. É a unidade visual das telas: lista, seção de formulário, card de painel. */
export default function Panel({ title, subtitle, action, flush, footer, children, sx }: PanelProps) {
  const hasHeader = title !== undefined || action !== undefined;
  const hasFooter = footer !== undefined && footer !== null;
  const body = flush ? children : <Box sx={{ p: 2.5, pb: hasFooter ? 2 : 2.5 }}>{children}</Box>;
  return (
    <Paper
      variant="outlined"
      sx={[
        { borderRadius: panelRadius, overflow: 'hidden' },
        // coluna flex só com rodapé: o corpo cresce e o rodapé desce até a borda do card esticado
        hasFooter && { display: 'flex', flexDirection: 'column' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {hasHeader && (
        <>
          {/* sem espaço para título e ações na mesma linha (celular), as ações descem e ficam à direita */}
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, px: 2.5, py: 1.75, minHeight: 60 }}
          >
            <Box sx={{ minWidth: 0 }}>
              {title !== undefined && (
                <Typography variant="h5" component="h2">
                  {title}
                </Typography>
              )}
              {subtitle !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action !== undefined && <Box sx={{ flexShrink: 0, ml: 'auto' }}>{action}</Box>}
          </Stack>
          <Divider />
        </>
      )}
      {hasFooter ? <Box sx={{ flex: '1 0 auto' }}>{body}</Box> : body}
      {hasFooter && <Box sx={{ px: 2.5, pb: 2.5, pt: flush ? 2 : 0, mt: 'auto' }}>{footer}</Box>}
    </Paper>
  );
}
