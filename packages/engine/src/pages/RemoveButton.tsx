// material-ui
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Trash } from 'iconsax-reactjs';

/** Lixeira de uma linha de lista with_parent: a remoção só vale ao salvar o formulário. `inline`: ao lado de campos. */
export function RemoveButton(props: { onClick: () => void; disabled?: boolean; title?: string; label?: string; inline?: boolean }) {
  const { onClick, disabled, title, label, inline } = props;
  return (
    <Tooltip title={title ?? 'Remover (só vale ao salvar)'}>
      <span>
        <IconButton
          size="small"
          color="error"
          onClick={onClick}
          disabled={disabled}
          aria-label={label ?? 'Remover'}
          sx={inline ? { mt: 1 } : undefined}
        >
          <Trash size={18} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
