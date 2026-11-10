import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Add, Paperclip2 } from 'iconsax-reactjs';

import { useChatText } from '../text';

export interface AddMenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
}

interface Props {
  files: boolean;
  accept?: string;
  items: AddMenuItem[];
  disabled?: boolean;
  /** Lado do botão redondo, em px. */
  size: number;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
}

/** O + da caixa: abre a escolha de arquivo direto ou, com `items`, um menu com "Anexar arquivo" e os itens do app. */
export default function AddButton({ files, accept, items, disabled, size, onPick }: Props) {
  const t = useChatText();
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const label = items.length ? t('c3.chat.add') : t('c3.chat.attach');
  const choose = (fn: () => void) => () => {
    setMenu(null);
    fn();
  };
  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          aria-haspopup={items.length ? 'menu' : undefined}
          disabled={disabled}
          onClick={(e) => (items.length ? setMenu(e.currentTarget) : fileRef.current?.click())}
          sx={{ bgcolor: 'action.hover', width: size, height: size, flexShrink: 0, ...(size < 30 && { borderRadius: '50%' }) }}
        >
          <Add size={size > 30 ? 20 : 18} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} slotProps={{ list: { dense: true } }}>
        {files && (
          <MenuItem onClick={choose(() => fileRef.current?.click())}>
            <ListItemIcon>
              <Paperclip2 size={16} />
            </ListItemIcon>
            {t('c3.chat.attach')}
          </MenuItem>
        )}
        {items.map((it) => (
          <MenuItem key={it.id} onClick={choose(it.onClick)}>
            {it.icon && <ListItemIcon>{it.icon}</ListItemIcon>}
            {it.label}
          </MenuItem>
        ))}
      </Menu>
      {files && <input ref={fileRef} type="file" multiple hidden accept={accept} onChange={onPick} aria-hidden tabIndex={-1} />}
    </>
  );
}
