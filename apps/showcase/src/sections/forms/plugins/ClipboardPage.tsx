import { useCallback, useEffect, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Copy, Scissor, TickCircle } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';

/** Copia texto com a API nativa e lembra, por alguns segundos, qual botão foi usado. */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string, key: string) => {
    if (!text) {
      notify('Não há nada para copiar.', 'warning');
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      notify('O navegador bloqueou o acesso à área de transferência.', 'error');
      return false;
    }
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2000);
    notify('Copiado para a área de transferência.');
    return true;
  }, []);

  return { copied, copy };
}

export default function ClipboardPage() {
  const { copied, copy } = useCopy();
  const [site, setSite] = useState('https://cecon.github.io/C3Theme/');
  const [texto, setTexto] = useState('Reunião de alinhamento na quinta-feira às 10h, sala 3. Trazer o relatório de vendas do trimestre.');
  const pixRef = useRef<HTMLDivElement>(null);

  const icon = (key: string) => (copied === key ? <TickCircle size={18} variant="Bold" /> : <Copy size={18} />);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Copiar de um campo">
          <TextField
            label="Endereço do site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied === 'site' ? 'Copiado!' : 'Copiar'}>
                      <IconButton
                        aria-label="Copiar endereço"
                        onClick={() => copy(site, 'site')}
                        edge="end"
                        color={copied === 'site' ? 'success' : 'default'}
                      >
                        {icon('site')}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Copiar de um elemento" subtitle="O texto vem do conteúdo de outro elemento da página">
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box
              ref={pixRef}
              sx={{
                flex: 1,
                minWidth: 0,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                fontFamily: 'monospace',
                fontSize: 13,
                wordBreak: 'break-all'
              }}
            >
              00020126360014BR.GOV.BCB.PIX0114+5511900000000520400005303986540549.905802BR
            </Box>
            <Button
              variant="outlined"
              color={copied === 'pix' ? 'success' : 'primary'}
              startIcon={icon('pix')}
              onClick={() => copy(pixRef.current?.textContent ?? '', 'pix')}
            >
              {copied === 'pix' ? 'Copiado' : 'Copiar'}
            </Button>
          </Stack>
        </Panel>
      </Grid>
      <Grid size={12}>
        <Panel title="Copiar ou recortar de uma área de texto">
          <TextField label="Anotação" value={texto} onChange={(e) => setTexto(e.target.value)} multiline minRows={4} fullWidth />
          <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
            <Button variant="contained" startIcon={icon('texto')} onClick={() => copy(texto, 'texto')}>
              Copiar
            </Button>
            <Button
              variant="outlined"
              startIcon={<Scissor size={18} />}
              onClick={async () => {
                if (await copy(texto, 'recorte')) setTexto('');
              }}
            >
              Recortar
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto !important' }}>
              {texto.length} caracteres
            </Typography>
          </Stack>
        </Panel>
      </Grid>
    </Grid>
  );
}
