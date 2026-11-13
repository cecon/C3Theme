import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { useChatText } from '../text';
import type { Author } from '../../core/types';

export interface PinnedMessage {
  messageId: string;
  author: Author;
  direction: 'in' | 'out';
  text: string;
  createdAt: string;
  pinnedAt: string;
}

export interface PinnedMenuProps {
  label?: string;
  items: PinnedMessage[];
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  onSelect: (id: string) => void;
}

export default function PinnedMenu({ label, items, loading, error, onRetry, onSelect }: PinnedMenuProps) {
  const t = useChatText();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button size="small" aria-haspopup="menu" aria-expanded={!!anchor} onClick={(e) => setAnchor(e.currentTarget)}>
        {label ?? t('c3.chat.pinned')} ({items.length})
      </Button>
      <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)} aria-label={label ?? t('c3.chat.pinned')}>
        {loading && <MenuItem disabled>{t('c3.chat.pinnedLoading')}</MenuItem>}
        {error && (
          <MenuItem onClick={onRetry}>
            <Alert severity="error">
              {error} · {t('c3.chat.retry')}
            </Alert>
          </MenuItem>
        )}
        {!loading && !error && items.length === 0 && <MenuItem disabled>{t('c3.chat.pinnedEmpty')}</MenuItem>}
        {items.map((item) => (
          <MenuItem
            key={item.messageId}
            onClick={() => {
              setAnchor(null);
              onSelect(item.messageId);
            }}
          >
            <ListItemText
              primary={item.text}
              secondary={item.author.name}
              sx={{ maxWidth: 320, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
