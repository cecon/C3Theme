import { useNavigate } from 'react-router';

// material-ui
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Edit, Edit2, Eye, Trash } from 'iconsax-reactjs';

import type { RowAction, WireRecord } from '../../types';

/** Ações da linha que o usuário pode usar (`update`/`delete` da tela e do registro). */
export function allowedRowActions(actions: RowAction[], can: { update?: boolean; delete?: boolean }, row?: WireRecord) {
  return actions.filter(
    (a) =>
      a === 'view' ||
      (a === 'edit' && can.update && (row?._can?.update ?? true)) ||
      (a === 'delete' && can.delete && (row?._can?.delete ?? true))
  );
}

/** Ícones Ver, Editar e Excluir na última coluna (`quiet`: lápis cinza). O clique não abre a linha. */
export function RowActionsCell({
  entity,
  row,
  title,
  actions,
  onView,
  onEdit,
  onDelete,
  quiet
}: {
  entity: string;
  row: WireRecord;
  /** Nome do registro para o leitor de tela ("Editar Ana Souza"). */
  title: string;
  actions: RowAction[];
  /** Sem ele, Ver navega para a página do registro. */
  onView?: (row: WireRecord) => void;
  onEdit: (row: WireRecord) => void;
  onDelete: (rows: WireRecord[]) => void;
  /** Ver e editar (lápis) em cinza. */
  quiet?: boolean;
}) {
  const navigate = useNavigate();
  const size = quiet ? 'medium' : 'small';
  return (
    <Stack direction="row" sx={{ justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
      {actions.includes('view') && (
        <Tooltip title={quiet ? 'Ver' : 'Ver detalhes'}>
          <IconButton
            size={size}
            color={quiet ? 'default' : 'secondary'}
            aria-label={`Ver ${title}`}
            onClick={() => (onView ? onView(row) : navigate(`/${entity}/${row.id}`))}
          >
            <Eye size={18} />
          </IconButton>
        </Tooltip>
      )}
      {actions.includes('edit') && (
        <Tooltip title="Editar">
          <IconButton size={size} color={quiet ? 'default' : 'primary'} aria-label={`Editar ${title}`} onClick={() => onEdit(row)}>
            {quiet ? <Edit2 size={18} /> : <Edit size={18} />}
          </IconButton>
        </Tooltip>
      )}
      {actions.includes('delete') && (
        <Tooltip title="Excluir">
          <IconButton size={size} color="error" aria-label={`Excluir ${title}`} onClick={() => onDelete([row])}>
            <Trash size={18} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
