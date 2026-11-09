import { KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { flattenNav, useNav } from './nav';
import { useUiText } from '../i18n';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Busca de telas pelo menu (Ctrl+K / ⌘K): digite parte do nome e Enter abre. */
export default function CommandSearch() {
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
        <IconButton aria-label={t('c3.search.open')} onClick={() => setOpen(true)}>
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
            {t('c3.search.button')}
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
        {open && <Palette onClose={() => setOpen(false)} />}
      </Dialog>
    </>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const groups = useNav();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const t = useUiText();

  const all = useMemo(() => flattenNav(groups), [groups]);
  const results = useMemo(() => {
    const q = normalize(query.trim());
    const hits = q ? all.filter(({ item, trail }) => normalize([...trail, item.title].join(' ')).includes(q)) : all;
    return hits.slice(0, 12);
  }, [all, query]);

  const go = (i: number) => {
    const hit = results[i];
    if (!hit) return;
    onClose();
    if (hit.item.external) window.open(hit.item.url, '_blank');
    else navigate(hit.item.url!);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setIndex((i) => Math.min(i + 1, results.length - 1));
    else if (e.key === 'ArrowUp') setIndex((i) => Math.max(i - 1, 0));
    else if (e.key === 'Enter') go(index);
    else return;
    e.preventDefault();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <SearchNormal1 size={20} />
        <InputBase
          autoFocus
          fullWidth
          placeholder={t('c3.search.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
      </Box>
      <List dense sx={{ maxHeight: 360, overflowY: 'auto', p: 1 }}>
        {results.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            {t('c3.search.empty')}
          </Typography>
        )}
        {results.map(({ item, trail }, i) => (
          <ListItemButton key={item.id} selected={i === index} onMouseEnter={() => setIndex(i)} onClick={() => go(i)}>
            <ListItemText primary={item.title} secondary={trail.join(' › ') || undefined} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
