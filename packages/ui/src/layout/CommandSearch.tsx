import { useEffect, useState } from 'react';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { useUiText } from '../i18n';
import Palette from './search/Palette';
import type { RecordSearch } from './search/types';

/**
 * Busca do Ctrl+K / ⌘K: telas do menu pelo nome e, com `search`, também os registros e mensagens que o backend acha
 * (GET /_search). Enter abre o achado.
 */
export default function CommandSearch({ search }: { search?: RecordSearch }) {
  const [open, setOpen] = useState(false);
  const compact = useMediaQuery((t: Theme) => t.breakpoints.down('md'));
  const t = useUiText();

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {compact ? (
        <IconButton aria-label={t(search ? 'c3.search.openAll' : 'c3.search.open')} onClick={() => setOpen(true)}>
          <SearchNormal1 size={20} />
        </IconButton>
      ) : (
        <ButtonBase
          onClick={() => setOpen(true)}
          sx={{
            gap: 1,
            px: 1.5,
            height: 38,
            width: 280,
            justifyContent: 'flex-start',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            color: 'text.secondary',
            bgcolor: 'background.paper'
          }}
        >
          <SearchNormal1 size={16} />
          <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>
            {t(search ? 'c3.search.buttonAll' : 'c3.search.button')}
          </Typography>
          <Typography variant="caption" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 0.75 }}>
            Ctrl K
          </Typography>
        </ButtonBase>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
      >
        {open && <Palette onClose={() => setOpen(false)} search={search} />}
      </Dialog>
    </>
  );
}
