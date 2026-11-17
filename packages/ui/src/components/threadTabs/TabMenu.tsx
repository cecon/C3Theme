import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { useThreadTabsText } from './threadTabsText';
import type { ThreadTab } from './types';

export interface TabMenuState {
  anchor: HTMLElement;
  tab: ThreadTab;
}

interface Props {
  menu?: TabMenuState;
  /** Pode ir para a esquerda/direita (a principal fica fixa na ponta). */
  canLeft: boolean;
  canRight: boolean;
  onClose: () => void;
  onRename?: () => void;
  onMove?: (delta: number) => void;
  onCloseTab?: () => void;
  onCloseOthers?: () => void;
}

/** Menu da aba (botão direito, tecla de menu ou Shift+F10): só as ações que a faixa recebeu. */
export default function TabMenu({ menu, canLeft, canRight, onClose, onRename, onMove, onCloseTab, onCloseOthers }: Props) {
  const t = useThreadTabsText();
  const closable = menu?.tab.closable !== false;
  const act = (run?: () => void) => () => {
    onClose();
    run?.();
  };
  return (
    <Menu open={!!menu} anchorEl={menu?.anchor} onClose={onClose}>
      {onRename && <MenuItem onClick={act(onRename)}>{t('c3.tabs.rename')}</MenuItem>}
      {onMove && (
        <MenuItem disabled={!canLeft} onClick={act(() => onMove(-1))}>
          {t('c3.tabs.left')}
        </MenuItem>
      )}
      {onMove && (
        <MenuItem disabled={!canRight} onClick={act(() => onMove(1))}>
          {t('c3.tabs.right')}
        </MenuItem>
      )}
      {(onCloseTab || onCloseOthers) && <Divider />}
      {onCloseTab && closable && <MenuItem onClick={act(onCloseTab)}>{t('c3.tabs.close')}</MenuItem>}
      {onCloseOthers && <MenuItem onClick={act(onCloseOthers)}>{t('c3.tabs.closeOthers')}</MenuItem>}
    </Menu>
  );
}
