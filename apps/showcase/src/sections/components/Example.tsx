import { ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Code1, Copy } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';

export interface ExampleProps {
  title: string;
  /** Uma frase sobre quando usar a variação. */
  description?: ReactNode;
  /** Trecho de código mostrado ao clicar no botão de código. */
  code?: string;
  /** Ocupa a linha inteira em telas grandes. */
  wide?: boolean;
  children: ReactNode;
}

async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    notify('Código copiado.', 'info');
  } catch {
    notify('Não foi possível copiar o código.', 'error');
  }
}

/** Bloco de exemplo: título, área de demonstração e, opcionalmente, o código que a produz. */
export default function Example({ title, description, code, wide, children }: ExampleProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <Grid size={{ xs: 12, lg: wide ? 12 : 6 }}>
      <Panel
        title={title}
        subtitle={description}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        action={
          code ? (
            <Tooltip title={showCode ? 'Esconder código' : 'Mostrar código'}>
              <IconButton
                aria-label={showCode ? 'Esconder código' : 'Mostrar código'}
                aria-expanded={showCode}
                color={showCode ? 'primary' : 'default'}
                onClick={() => setShowCode((v) => !v)}
              >
                <Code1 size={20} />
              </IconButton>
            </Tooltip>
          ) : undefined
        }
      >
        {children}
        {code && (
          <Collapse in={showCode} unmountOnExit>
            <Box sx={{ position: 'relative', mt: 2.5 }}>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  pr: 6,
                  borderRadius: 2,
                  overflowX: 'auto',
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: '0.8125rem',
                  lineHeight: 1.6
                }}
                dir="ltr"
              >
                <code>{code.trim()}</code>
              </Box>
              <Tooltip title="Copiar">
                <IconButton
                  size="small"
                  aria-label="Copiar código"
                  onClick={() => copy(code.trim())}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <Copy size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          </Collapse>
        )}
      </Panel>
    </Grid>
  );
}

/** Página de exemplos: uma frase de introdução e a grade de blocos. */
export function ExamplePage({ intro, children }: { intro?: ReactNode; children: ReactNode }) {
  return (
    <Stack spacing={3}>
      {intro && (
        <Typography color="text.secondary" sx={{ maxWidth: 820 }}>
          {intro}
        </Typography>
      )}
      <Grid container spacing={3}>
        {children}
      </Grid>
    </Stack>
  );
}

/** Linha de demonstração que quebra no celular. */
export function Row({ children, gap = 1.5, align = 'center' }: { children: ReactNode; gap?: number; align?: 'center' | 'flex-start' }) {
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap, alignItems: align }}>
      {children}
    </Stack>
  );
}
