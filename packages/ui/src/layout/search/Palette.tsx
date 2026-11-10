import { KeyboardEvent, ReactNode, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { elapsed, toMillis } from '../../components/device/format';
import { useUiText } from '../../i18n';
import { flattenNav, useNav } from '../nav';
import Highlight from './Highlight';
import { normalize } from './highlight';
import type { RecordSearch } from './types';
import useRecordHits from './useRecordHits';

interface Row {
  key: string;
  group?: string;
  title: string;
  secondary?: string | null;
  icon?: ReactNode;
  at?: string | null;
  go: () => void;
}

/** A paleta do Ctrl K: telas do menu primeiro e, com `search`, os grupos que o backend achou. */
export default function Palette({ onClose, search }: { onClose: () => void; search?: RecordSearch }) {
  const nav = useNav();
  const navigate = useNavigate();
  const intl = useIntl();
  const t = useUiText();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const { hits, loading } = useRecordHits(search, query);

  const all = useMemo(() => flattenNav(nav), [nav]);
  const rows = useMemo<Row[]>(() => {
    const q = normalize(query.trim());
    const screens = (q ? all.filter(({ item, trail }) => normalize([...trail, item.title].join(' ')).includes(q)) : all).slice(0, 12);
    const open = (url: string, external?: boolean) => () => {
      onClose();
      if (external) window.open(url, '_blank');
      else navigate(url);
    };
    return [
      ...screens.map(({ item, trail }) => ({
        key: `nav:${item.id}`,
        group: hits.length ? t('c3.search.screens') : undefined,
        title: item.title,
        secondary: trail.join(' › ') || undefined,
        go: open(item.url!, item.external)
      })),
      ...hits.map((h, i) => ({ key: `hit:${i}:${h.path}`, ...h, secondary: h.snippet, go: open(h.path) }))
    ];
  }, [all, hits, query, navigate, onClose, t]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') setIndex((i) => Math.min(i + 1, rows.length - 1));
    else if (e.key === 'ArrowUp') setIndex((i) => Math.max(i - 1, 0));
    else if (e.key === 'Enter') rows[index]?.go();
    else return;
    e.preventDefault();
  };
  const when = (at: string) => {
    const { value, unit } = elapsed(toMillis(at), Date.now());
    return intl.formatRelativeTime(value, unit, { numeric: 'auto' });
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
          inputProps={{ 'aria-label': t('c3.search.placeholder') }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <Typography variant="caption" color="text.secondary" role="status" sx={{ whiteSpace: 'nowrap' }}>
            {t('c3.search.loading')}
          </Typography>
        )}
      </Box>
      <List dense sx={{ maxHeight: 420, overflowY: 'auto', p: 1 }}>
        {rows.length === 0 && !loading && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            {t(search ? 'c3.search.nothing' : 'c3.search.empty')}
          </Typography>
        )}
        {rows.map((r, i) => (
          <Box key={r.key} component="li" sx={{ listStyle: 'none' }}>
            {r.group && r.group !== rows[i - 1]?.group && (
              <ListSubheader component="div" disableSticky sx={{ lineHeight: 2.5, bgcolor: 'transparent' }}>
                {r.group}
              </ListSubheader>
            )}
            <ListItemButton selected={i === index} onMouseEnter={() => setIndex(i)} onClick={r.go}>
              {r.icon && <ListItemIcon sx={{ minWidth: 32 }}>{r.icon}</ListItemIcon>}
              <ListItemText
                primary={<Highlight text={r.title} query={query} />}
                secondary={r.secondary ? <Highlight text={r.secondary} query={query} /> : undefined}
                slotProps={{ secondary: { noWrap: true } }}
              />
              {r.at && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                  {when(r.at)}
                </Typography>
              )}
            </ListItemButton>
          </Box>
        ))}
      </List>
    </Box>
  );
}
