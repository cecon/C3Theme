import { useId, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Cpu, More } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import StatusChip, { type StatusTone } from '../StatusChip';
import { hasMenu, isBusy, mainActionFor, percentOf, toneFor } from './providerState';
import type { ProviderActions, ProviderItem } from './types';

// movimento reduzido: barra parada (a indeterminada vira faixa cheia e clara) e sem o anel girando
const REDUCE = '@media (prefers-reduced-motion: reduce)';
const STILL_BAR = {
  [REDUCE]: {
    '& .MuiLinearProgress-bar': { transition: 'none', animation: 'none' },
    '&.MuiLinearProgress-indeterminate .MuiLinearProgress-bar1': { left: 0, right: 0, width: 'auto', opacity: 0.5 },
    '&.MuiLinearProgress-indeterminate .MuiLinearProgress-bar2': { display: 'none' }
  }
};
const NO_SPINNER = { [REDUCE]: { display: 'none' } };

/** Uma linha: ícone, nome com o selo do estado, detalhe e as ações que o estado permite. */
export function ProviderRow({ item, actions }: { item: ProviderItem; actions: ProviderActions }) {
  const t = useUiText();
  const ids = useId();
  const [menuAt, setMenuAt] = useState<HTMLElement | null>(null);
  const nameId = `${ids}-name`;
  const errorId = `${ids}-error`;
  const { id, name, status } = item;
  const statusLabel = t(`c3.providers.status.${status}`);
  const percent = percentOf(item.progress);

  const main = mainActionFor(status);
  const mainHandler =
    main === 'install' ? actions.onInstall : main === 'signIn' ? actions.onSignIn : main === 'retry' ? actions.onRetry : undefined;
  const mainLabel = main && t(`c3.providers.${main}`);
  const anyMenu = !!(actions.onCheckUpdate || actions.onRemove);
  const menu = anyMenu && hasMenu(status);

  const pick = (fn?: (id: string) => void) => () => {
    setMenuAt(null);
    fn?.(id);
  };

  return (
    <Stack component="li" direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 2, py: 1.5 }}>
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary',
          '& img, & svg': { maxWidth: 32, maxHeight: 32 }
        }}
      >
        {item.icon ?? <Cpu size={28} variant="Bulk" />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography id={nameId} variant="subtitle1" noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
            {name}
          </Typography>
          <StatusChip label={statusLabel} tone={toneFor(status) as StatusTone} />
        </Stack>
        {item.detail && (
          <Typography variant="body2" color="text.secondary" noWrap title={item.detail}>
            {item.detail}
          </Typography>
        )}
        {status === 'installing' && (
          <LinearProgress
            variant={percent === undefined ? 'indeterminate' : 'determinate'}
            value={percent ?? 0}
            aria-labelledby={nameId}
            aria-valuetext={
              percent === undefined ? t('c3.providers.progressUnknown', { name }) : t('c3.providers.progress', { name, percent })
            }
            sx={{ mt: 0.75, height: 6, borderRadius: 3, ...STILL_BAR }}
          />
        )}
        {status === 'error' && item.error && (
          <Typography id={errorId} variant="body2" color="error" sx={{ mt: 0.25 }}>
            {item.error}
          </Typography>
        )}
      </Box>
      {status === 'installing' && percent !== undefined && (
        <Typography variant="body2" color="text.secondary" aria-hidden sx={{ minWidth: 40, textAlign: 'end' }}>
          {percent}%
        </Typography>
      )}
      {status === 'signing-in' && <CircularProgress size={20} aria-labelledby={nameId} aria-valuetext={statusLabel} sx={NO_SPINNER} />}
      {main && mainHandler && (
        <Button
          size="small"
          variant={main === 'retry' ? 'outlined' : 'contained'}
          color={main === 'retry' ? 'error' : 'primary'}
          aria-label={t('c3.providers.actionOf', { action: mainLabel!, name })}
          aria-describedby={main === 'retry' && item.error ? errorId : undefined}
          onClick={() => mainHandler(id)}
          sx={{ flexShrink: 0 }}
        >
          {mainLabel}
        </Button>
      )}
      {/* vaga do menu nas linhas sem ele, para os botões ficarem na mesma coluna */}
      {anyMenu && !menu && <Box aria-hidden sx={{ width: 34, flexShrink: 0 }} />}
      {menu && (
        <>
          <IconButton
            size="small"
            aria-label={t('c3.providers.more', { name })}
            aria-haspopup="menu"
            aria-expanded={menuAt ? true : undefined}
            disabled={isBusy(status)}
            onClick={(e) => setMenuAt(e.currentTarget)}
          >
            <More size={20} />
          </IconButton>
          <Menu anchorEl={menuAt} open={!!menuAt} onClose={() => setMenuAt(null)}>
            {actions.onCheckUpdate && <MenuItem onClick={pick(actions.onCheckUpdate)}>{t('c3.providers.checkUpdate')}</MenuItem>}
            {actions.onRemove && (
              <MenuItem onClick={pick(actions.onRemove)} sx={{ color: 'error.main' }}>
                {t('c3.providers.remove')}
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </Stack>
  );
}
