import { useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowLeft, ArrowRight, Lock1, Refresh, Unlock } from 'iconsax-reactjs';

import { addressParts, normalizeAddress } from '../../core/hitlBrowser';
import { useChatText } from '../text';
import { secondarySx } from './sx';

export interface BrowserBarProps {
  url: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  /** Sem a função, o botão aparece desligado (o agente está no controle). */
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  /** Com isso, clicar no endereço deixa digitar outro; Enter vai, Esc desiste. */
  onNavigate?: (url: string) => void;
}

const barSx = { alignItems: 'center', px: 0.75, py: 0.5, bgcolor: 'action.hover' };
const pillSx = {
  flex: 1,
  minWidth: 0,
  ml: 0.5,
  borderRadius: 5,
  bgcolor: 'background.paper',
  px: 1.25,
  height: 30,
  display: 'flex',
  alignItems: 'center'
};
const addressSx = { flex: 1, minWidth: 0, justifyContent: 'flex-start', gap: 0.75, height: '100%' };
const pathSx = { minWidth: 0 };
const hostSx = { color: 'text.primary' };

/** Barra do navegador interno: voltar, avançar, recarregar e o endereço com cadeado. */
export default function BrowserBar({ url, canGoBack, canGoForward, onBack, onForward, onReload, onNavigate }: BrowserBarProps) {
  const t = useChatText();
  const [editing, setEditing] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const parts = addressParts(url);

  function go() {
    const next = normalizeAddress(editing ?? '');
    if (!next) return setInvalid(true);
    setEditing(null);
    onNavigate?.(next);
  }

  const nav = (label: string, icon: ReactNode, onClick?: () => void, enabled = true) => (
    <Tooltip title={label}>
      <span>
        <IconButton size="small" aria-label={label} disabled={!onClick || !enabled} onClick={onClick}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Stack direction="row" spacing={0.25} sx={barSx}>
      {nav(t('c3.chat.browser.back'), <ArrowLeft size={16} />, onBack, canGoBack)}
      {nav(t('c3.chat.browser.forward'), <ArrowRight size={16} />, onForward, canGoForward)}
      {nav(t('c3.chat.browser.reload'), <Refresh size={16} />, onReload)}
      <Box sx={pillSx}>
        {editing !== null ? (
          <InputBase
            autoFocus
            fullWidth
            value={editing}
            error={invalid}
            onChange={(e) => {
              setEditing(e.target.value);
              setInvalid(false);
            }}
            onBlur={() => setEditing(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go();
              if (e.key === 'Escape') setEditing(null);
            }}
            inputProps={{ 'aria-label': t('c3.chat.browser.address'), 'aria-invalid': invalid || undefined, spellCheck: false }}
            sx={{ typography: 'body2', color: invalid ? 'error.main' : undefined }}
          />
        ) : (
          <ButtonBase
            disabled={!onNavigate}
            onClick={() => setEditing(url)}
            aria-label={`${t('c3.chat.browser.address')}: ${url}`}
            sx={addressSx}
          >
            <Box
              component="span"
              title={t(parts?.secure ? 'c3.chat.browser.secure' : 'c3.chat.browser.insecure')}
              sx={{ display: 'flex', color: parts?.secure ? 'text.secondary' : 'warning.main' }}
            >
              {parts?.secure ? <Lock1 size={14} /> : <Unlock size={14} />}
            </Box>
            <Typography variant="body2" noWrap component="span" sx={pathSx}>
              <Box component="span" sx={hostSx}>
                {parts?.host ?? url}
              </Box>
              <Box component="span" sx={secondarySx}>
                {parts?.rest}
              </Box>
            </Typography>
          </ButtonBase>
        )}
      </Box>
    </Stack>
  );
}
