import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';

import TabStateMark from './TabStateMark';
import { useThreadTabsText } from './threadTabsText';
import type { ThreadTab } from './types';

export const TAB_DRAG = 'application/x-c3-thread-tab';

interface Props {
  tab: ThreadTab;
  selected: boolean;
  /** Roving tabindex: só a aba focável da faixa entra na ordem do Tab. */
  focusable: boolean;
  draggable: boolean;
  onSelect: () => void;
  onClose?: () => void;
  onMenu: (anchor: HTMLElement) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onDropOn: (dragged: string) => void;
}

/** Uma aba: `role="tab"`, estado no nome acessível, × de fechar só visual (teclado fecha por Delete ou pelo menu). */
export default function TabItem({ tab, selected, focusable, draggable, onSelect, onClose, onMenu, onKeyDown, onDropOn }: Props) {
  const t = useThreadTabsText();
  const status = tab.disabled ? t('c3.tabs.unavailable', { reason: tab.disabled }) : tab.state && t(`c3.tabs.state.${tab.state}`);
  const closable = tab.closable !== false && !!onClose;
  const button = (
    <ButtonBase
      role="tab"
      id={`thread-tab-${tab.id}`}
      data-tab-id={tab.id}
      aria-selected={selected}
      aria-disabled={tab.disabled ? true : undefined}
      aria-label={status ? `${tab.label}, ${status}` : tab.label}
      tabIndex={focusable ? 0 : -1}
      draggable={draggable}
      onClick={() => !tab.disabled && onSelect()}
      onAuxClick={(e: MouseEvent) => e.button === 1 && closable && onClose!()}
      onContextMenu={(e: MouseEvent<HTMLElement>) => {
        e.preventDefault();
        onMenu(e.currentTarget);
      }}
      onKeyDown={onKeyDown}
      onDragStart={(e: DragEvent) => {
        e.dataTransfer.setData(TAB_DRAG, tab.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e: DragEvent) => e.dataTransfer.types.includes(TAB_DRAG) && e.preventDefault()}
      onDrop={(e: DragEvent) => {
        const dragged = e.dataTransfer.getData(TAB_DRAG);
        if (!dragged) return;
        e.preventDefault();
        onDropOn(dragged);
      }}
      sx={{
        flexShrink: 0,
        gap: 0.75,
        px: 1.5,
        height: 36,
        maxWidth: 220,
        borderBottom: 2,
        borderColor: selected ? 'primary.main' : 'transparent',
        color: tab.disabled ? 'text.disabled' : selected ? 'text.primary' : 'text.secondary',
        fontWeight: selected ? 600 : 400,
        fontSize: 13,
        '&:hover': { bgcolor: 'action.hover' },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 }
      }}
    >
      {tab.state && !tab.disabled && <TabStateMark state={tab.state} />}
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tab.label}
      </Box>
      {closable && (
        <Box
          component="span"
          aria-hidden="true"
          data-close
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            onClose!();
          }}
          sx={{ ml: 0.25, px: 0.5, borderRadius: 1, lineHeight: 1, opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'action.selected' } }}
        >
          ×
        </Box>
      )}
    </ButtonBase>
  );
  return tab.disabled ? <Tooltip title={tab.disabled}>{button}</Tooltip> : button;
}
