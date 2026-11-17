import { useEffect, useState, type DragEvent, type KeyboardEvent } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Add } from 'iconsax-reactjs';

import SidebarEditor from '../../layout/sidebar/SidebarEditor';
import { moveBy, moveTo } from './order';
import TabItem, { TAB_DRAG } from './TabItem';
import TabListMenu from './TabListMenu';
import TabMenu, { type TabMenuState } from './TabMenu';
import { useThreadTabsText } from './threadTabsText';
import type { ThreadTabsProps } from './types';
import useOverflow from './useOverflow';

const HEIGHT = 40;
const STRIP_SX = { display: 'flex', alignItems: 'center', minHeight: HEIGHT, borderBottom: 1, borderColor: 'divider', px: 0.5 } as const;
const HIDDEN_SX = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' } as const;
const focusTab = (id: string) => requestAnimationFrame(() => document.getElementById(`thread-tab-${id}`)?.focus());

/**
 * Faixa de abas das threads (#134): uma aba por thread, ativa marcada (`aria-selected`), setas e Home/End trocam,
 * Delete fecha, F2 renomeia, menu pelo botão direito ou Shift+F10, arrastar reordena (rolando nas bordas), sombra
 * e lista de todas quando não cabem. No celular vira só o botão de lista. Os dados e o que cada ação faz são do app.
 */
export default function ThreadTabs(props: ThreadTabsProps) {
  const { label, tabs, active, onSelect, onNew, onClose, onCloseOthers, onRename, onReorder, closed = [], onReopen } = props;
  const t = useThreadTabsText();
  const narrow = useMediaQuery(useTheme().breakpoints.down('sm'));
  const { ref, overflow, measure, scrollIntoView } = useOverflow(tabs.length);
  const [menu, setMenu] = useState<TabMenuState>();
  const [renaming, setRenaming] = useState<string>();
  const [announcement, announce] = useState('');
  const ids = tabs.map((tab) => tab.id);
  // sem aba ativa na lista, a primeira recebe o foco do Tab: a faixa nunca fica fora do teclado
  const focusId = ids.includes(active) ? active : ids[0];
  const locked = tabs.findIndex((tab) => tab.closable !== false);
  const fixed = locked < 0 ? tabs.length : locked;
  useEffect(() => scrollIntoView(active), [active, scrollIntoView]);

  const reorder = (next: string[], id: string) => {
    onReorder?.(next);
    const tab = tabs.find((x) => x.id === id)!;
    announce(t('c3.tabs.moved', { label: tab.label, at: next.indexOf(id) + 1, total: next.length }));
  };
  const enabled = tabs.filter((tab) => !tab.disabled).map((tab) => tab.id);
  const go = (id: string | undefined) => {
    if (!id) return;
    onSelect(id);
    focusTab(id);
  };
  const keys = (id: string) => (e: KeyboardEvent<HTMLElement>) => {
    const at = enabled.indexOf(id);
    const tab = tabs.find((x) => x.id === id)!;
    const closable = tab.closable !== false && !!onClose;
    const step: Record<string, (() => void) | undefined> = {
      ArrowRight: () => go(enabled[(at + 1) % enabled.length]),
      ArrowLeft: () => go(enabled[(at - 1 + enabled.length) % enabled.length]),
      Home: () => go(enabled[0]),
      End: () => go(enabled[enabled.length - 1]),
      Delete: closable ? () => onClose!(id) : undefined,
      F2: onRename ? () => setRenaming(id) : undefined,
      ContextMenu: () => setMenu({ anchor: e.currentTarget, tab })
    };
    const run = e.shiftKey && e.key === 'F10' ? step.ContextMenu : step[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  };
  const edgeScroll = (e: DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes(TAB_DRAG)) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX < box.left + 32) e.currentTarget.scrollLeft -= 16;
    if (e.clientX > box.right - 32) e.currentTarget.scrollLeft += 16;
  };

  if (props.loading)
    return (
      <Box role="status" aria-label={t('c3.tabs.loading')} sx={{ ...STRIP_SX, gap: 1, px: 1.5 }}>
        {[96, 120, 88].map((w) => (
          <Skeleton key={w} variant="rounded" width={w} height={20} />
        ))}
      </Box>
    );
  if (props.error)
    return (
      <Alert
        severity="error"
        sx={{ minHeight: HEIGHT, py: 0, borderRadius: 0 }}
        action={props.onRetry && <Button onClick={props.onRetry}>{t('c3.tabs.retry')}</Button>}
      >
        {props.error}
      </Alert>
    );

  const menuAt = menu ? ids.indexOf(menu.tab.id) : -1;
  const shadow = (side: 'left' | 'right') => ({
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 16,
    pointerEvents: 'none',
    [side]: 0,
    background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(0,0,0,0.12), transparent)`
  });
  const renamed = tabs.find((tab) => tab.id === renaming);
  return (
    <Box sx={STRIP_SX}>
      {narrow ? (
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <TabListMenu tabs={tabs} active={active} showActive closed={closed} onSelect={onSelect} onReopen={onReopen} />
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            '&::before': overflow.start ? shadow('left') : {},
            '&::after': overflow.end ? shadow('right') : {}
          }}
        >
          <Box
            ref={ref}
            role="tablist"
            aria-label={label}
            onScroll={measure}
            onDragOver={edgeScroll}
            sx={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
          >
            {tabs.map((tab, at) => (
              <TabItem
                key={tab.id}
                tab={tab}
                selected={tab.id === active}
                focusable={tab.id === focusId}
                draggable={!!onReorder && at >= fixed}
                onSelect={() => onSelect(tab.id)}
                onClose={onClose && (() => onClose(tab.id))}
                onMenu={(anchor) => setMenu({ anchor, tab })}
                onKeyDown={keys(tab.id)}
                onDropOn={(dragged) => dragged !== tab.id && reorder(moveTo(ids, dragged, Math.max(fixed, at)), dragged)}
              />
            ))}
          </Box>
        </Box>
      )}
      {!narrow && (overflow.start || overflow.end || (onReopen && closed.length > 0)) && (
        <TabListMenu tabs={tabs} active={active} showActive={false} closed={closed} onSelect={go} onReopen={onReopen} />
      )}
      {onNew && (
        <IconButton size="small" aria-label={t('c3.tabs.new')} onClick={onNew} sx={{ flexShrink: 0 }}>
          <Add size={18} />
        </IconButton>
      )}
      <TabMenu
        menu={menu}
        canLeft={menuAt > fixed}
        canRight={menuAt >= fixed && menuAt < ids.length - 1}
        onClose={() => setMenu(undefined)}
        onRename={onRename && menu && (() => setRenaming(menu.tab.id))}
        onMove={onReorder && menu && ((delta) => reorder(moveBy(ids, menu.tab.id, delta, fixed), menu.tab.id))}
        onCloseTab={onClose && menu && (() => onClose(menu.tab.id))}
        onCloseOthers={onCloseOthers && menu && (() => onCloseOthers(menu.tab.id))}
      />
      {renamed && (
        <SidebarEditor
          title={t('c3.tabs.renameTitle')}
          initial={renamed.label}
          onClose={() => {
            setRenaming(undefined);
            focusTab(renamed.id);
          }}
          onSave={(name) => {
            onRename?.(renamed.id, name);
            setRenaming(undefined);
            focusTab(renamed.id);
          }}
        />
      )}
      <Box role="status" aria-live="polite" sx={HIDDEN_SX}>
        {announcement}
      </Box>
    </Box>
  );
}
