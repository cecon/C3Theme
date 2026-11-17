import { useState } from 'react';

import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ArrowDown2 } from 'iconsax-reactjs';

import { useThreadTabsText } from './threadTabsText';
import type { ThreadTab } from './types';

interface Props {
  tabs: ThreadTab[];
  active: string;
  /** No celular o botão mostra o nome da aba ativa; na faixa larga, só "Todas as abas". */
  showActive: boolean;
  closed: { id: string; label: string }[];
  onSelect: (id: string) => void;
  onReopen?: (id: string) => void;
}

/** Lista de todas as abas (quando não cabem ou no celular) e das threads fechadas para reabrir. */
export default function TabListMenu({ tabs, active, showActive, closed, onSelect, onReopen }: Props) {
  const t = useThreadTabsText();
  const [anchor, setAnchor] = useState<HTMLElement>();
  const current = tabs.find((tab) => tab.id === active);
  const pick = (run: () => void) => () => {
    setAnchor(undefined);
    run();
  };
  return (
    <>
      <Button
        size="small"
        color="inherit"
        endIcon={<ArrowDown2 size={14} />}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label={showActive && current ? `${t('c3.tabs.list')}: ${current.label}` : t('c3.tabs.list')}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ flexShrink: 0, textTransform: 'none', minWidth: 0, maxWidth: showActive ? 1 : undefined }}
      >
        {showActive && current ? current.label : null}
      </Button>
      <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(undefined)}>
        {tabs.map((tab) => (
          <MenuItem key={tab.id} selected={tab.id === active} disabled={!!tab.disabled} onClick={pick(() => onSelect(tab.id))}>
            {tab.label}
          </MenuItem>
        ))}
        {onReopen && closed.length > 0 && <ListSubheader>{t('c3.tabs.reopen')}</ListSubheader>}
        {onReopen &&
          closed.map((c) => (
            <MenuItem key={c.id} onClick={pick(() => onReopen(c.id))}>
              {c.label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}
