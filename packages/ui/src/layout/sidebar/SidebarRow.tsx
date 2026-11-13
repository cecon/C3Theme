import { useRef, type DragEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { SidebarItem } from './types';

export default function SidebarRow({
  item,
  pinned,
  active,
  onSelect,
  onMenu,
  onPin,
  onMove
}: {
  item: SidebarItem;
  pinned: boolean;
  active: boolean;
  onSelect: () => void;
  onPin: () => void;
  onMenu: (anchor: HTMLElement) => void;
  onMove: (id: string) => void;
}) {
  const row = useRef<HTMLButtonElement>(null);
  const drop = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes('application/x-c3-sidebar-item')) return;
    event.preventDefault();
    event.stopPropagation();
    const id = event.dataTransfer.getData('application/x-c3-sidebar-item');
    if (id) onMove(id);
    event.currentTarget.removeAttribute('data-drop');
  };
  return (
    <Box
      role="group"
      aria-label={item.label}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-c3-sidebar-item')) {
          e.preventDefault();
          e.currentTarget.setAttribute('data-drop', 'true');
        }
      }}
      onDragLeave={(e) => e.currentTarget.removeAttribute('data-drop')}
      onDrop={drop}
      sx={{ display: 'flex', alignItems: 'center', '&[data-drop]': { outline: '2px solid', outlineColor: 'primary.main' } }}
    >
      <Button
        ref={row}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-c3-sidebar-item', item.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        aria-current={active ? 'page' : undefined}
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault();
          onMenu(e.currentTarget);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
            e.preventDefault();
            onMenu(e.currentTarget);
          }
        }}
        sx={{
          justifyContent: 'flex-start',
          flex: 1,
          minWidth: 0,
          gap: 1,
          textTransform: 'none',
          bgcolor: active ? 'action.selected' : undefined
        }}
      >
        {item.mark && (
          <Box component="span" aria-hidden="true">
            {item.mark}
          </Box>
        )}
        <Box sx={{ minWidth: 0, textAlign: 'left' }}>
          <Typography noWrap>{item.label}</Typography>
          {item.status && (
            <Typography variant="caption" color="text.secondary">
              {item.status}
            </Typography>
          )}
        </Box>
        {!!item.pending && (
          <Typography variant="caption" sx={{ ml: 'auto' }}>
            {item.pending} pendentes
          </Typography>
        )}
      </Button>
      <IconButton size="small" aria-label={`${pinned ? 'Desafixar' : 'Fixar'} ${item.label}`} aria-pressed={pinned} onClick={onPin}>
        {pinned ? '★' : '☆'}
      </IconButton>
      <IconButton size="small" aria-label={`Ações de ${item.label}`} onClick={() => row.current && onMenu(row.current)}>
        ⋯
      </IconButton>
    </Box>
  );
}
