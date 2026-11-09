// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

// third-party
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowDown2 } from 'iconsax-reactjs';

import { useUiText } from '../i18n';

/** Botão de expandir/recolher com a seta girando (respeita RTL). */
export function ExpandButton({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      aria-expanded={open}
      color={open ? 'primary' : 'secondary'}
    >
      <Box
        component="span"
        sx={(theme) => ({
          display: 'inline-flex',
          transition: 'transform .2s',
          transform: open ? 'none' : theme.direction === 'rtl' ? 'rotate(90deg)' : 'rotate(-90deg)'
        })}
      >
        <ArrowDown2 size={16} />
      </Box>
    </IconButton>
  );
}

function ExpandRow({ open, onClick }: { open: boolean; onClick: () => void }) {
  const t = useUiText();
  return <ExpandButton open={open} onClick={onClick} label={t(open ? 'c3.table.collapseRow' : 'c3.table.expandRow')} />;
}

/** Coluna com o botão de expandir a linha (detalhe ou sub-linhas). */
export function expandColumn<T>(): ColumnDef<T> {
  return {
    id: 'expand',
    header: () => null,
    size: 52,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableGrouping: false,
    cell: ({ row }) => (row.getCanExpand() ? <ExpandRow open={row.getIsExpanded()} onClick={row.getToggleExpandedHandler()} /> : null)
  };
}
