import { useEffect, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

// third-party
import { Copy, TickCircle } from 'iconsax-reactjs';

import { cleanPairingCode, formatPairingCode, spellPairingCode } from './format';
import { useDeviceText } from './text';

/** Código de pareamento grande, em dois grupos, soletrado para o leitor de tela e com botão de copiar. */
export default function PairingCode({ code }: { code: string }) {
  const t = useDeviceText();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  useEffect(() => setCopied(false), [code]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(cleanPairingCode(code));
      setCopied(true);
    } catch {
      // sem permissão de área de transferência: o código continua selecionável na tela
    }
  }

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box
        role="group"
        aria-label={`${t('c3.device.code.label')}: ${spellPairingCode(code)}`}
        sx={(theme) => ({
          px: 2.5,
          py: 1.5,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: theme.vars.palette.background.default,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: '2rem',
          fontWeight: 600,
          letterSpacing: '0.18em',
          lineHeight: 1.2,
          userSelect: 'all'
        })}
      >
        <span aria-hidden>{formatPairingCode(code)}</span>
      </Box>
      <Button
        size="small"
        color="secondary"
        onClick={copy}
        startIcon={copied ? <TickCircle size={18} /> : <Copy size={18} />}
        aria-live="polite"
      >
        {copied ? t('c3.device.copied') : t('c3.device.copy')}
      </Button>
    </Stack>
  );
}
