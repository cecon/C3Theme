import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import SidebarEditor from './sidebar/SidebarEditor';
import SidebarFooter from './sidebar/SidebarFooter';
import type { SectionSidebarProps } from './sidebar/types';
import useSidebarController from './sidebar/useSidebarController';
import SidebarMenus from './sidebar/SidebarMenus';
import { toggleId } from './sidebar/preferences';

export type { SectionSidebarProps, SidebarItem, SidebarSection, SidebarCard } from './sidebar/types';

/** Lista lateral com preferências locais por servidor; os dados e as ações de negócio continuam no app. */
export default function SectionSidebar(props: SectionSidebarProps) {
  return <SidebarScope key={props.storageKey} {...props} />;
}
function SidebarScope(props: SectionSidebarProps) {
  const controller = useSidebarController(props);
  const {
    prefs,
    announcement,
    failure,
    setMenu,
    editor,
    setEditor,
    dragSection,
    heading,
    change,
    sections,
    visible,
    assigned,
    pinned,
    move,
    run,
    row,
    addSection,
    sectionIds
  } = controller;
  const { label, title, views, view, onView, loading, error, onRetry } = props;
  return (
    <Box
      component="nav"
      aria-label={label}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', bgcolor: 'background.paper' }}
    >
      <Box component="header" sx={{ p: 1.5, flexShrink: 0 }}>
        <Typography component="h2" variant="h6">
          {title}
        </Typography>
        {views && views.length > 1 && (
          <Select
            size="small"
            fullWidth
            value={view ?? views[0].id}
            inputProps={{ 'aria-label': 'Visão da lista' }}
            onChange={(e) => onView?.(e.target.value)}
          >
            {views.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                {v.label}
              </MenuItem>
            ))}
          </Select>
        )}
        {prefs.hidden.length > 0 && (
          <Button size="small" onClick={() => change((p) => ({ ...p, hidden: [] }), 'Itens reexibidos')}>
            Mostrar ocultos
          </Button>
        )}
        <Button ref={heading} size="small" onClick={addSection}>
          Criar seção
        </Button>
      </Box>
      {failure && <Alert severity="error">{failure}</Alert>}
      <Box
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('application/x-c3-sidebar-item') && !dragSection.current) return;
          const bounds = e.currentTarget.getBoundingClientRect();
          if (e.clientY < bounds.top + 32) e.currentTarget.scrollTop -= 16;
          if (e.clientY > bounds.bottom - 32) e.currentTarget.scrollTop += 16;
        }}
      >
        {loading ? (
          <Box aria-label="Carregando lista" sx={{ p: 2 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={40} />
            ))}
          </Box>
        ) : error ? (
          <Alert severity="error" action={onRetry && <Button onClick={onRetry}>Tentar de novo</Button>}>
            {error}
          </Alert>
        ) : (
          <>
            {pinned.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ px: 1.5 }}>
                  Fixados
                </Typography>
                {pinned.map(row)}
              </Box>
            )}
            {sections.map((section) => {
              const children = visible.filter((i) => assigned(i) === section.id && !prefs.pinned.includes(i.id));
              const count = visible.filter((i) => assigned(i) === section.id).length;
              const pending =
                (section.pending ?? 0) + visible.filter((i) => assigned(i) === section.id).reduce((sum, i) => sum + (i.pending ?? 0), 0);
              const collapsed = prefs.collapsed.includes(section.id);
              return (
                <Box
                  key={section.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceSection = dragSection.current;
                    if (sourceSection === section.id) {
                      dragSection.current = null;
                      return;
                    }
                    if (sourceSection && sourceSection !== section.id) {
                      const ids = sectionIds.filter((id) => id !== sourceSection);
                      ids.splice(ids.indexOf(section.id), 0, sourceSection);
                      change((p) => ({ ...p, sectionOrder: ids }), 'Ordem das seções alterada');
                      dragSection.current = null;
                    } else {
                      const source = visible.find((i) => i.id === e.dataTransfer.getData('application/x-c3-sidebar-item'));
                      if (source) move(source, section.id);
                    }
                  }}
                  sx={{ p: 0.5, '&:focus-within': { borderColor: 'primary.main' } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      draggable
                      onDragStart={(e) => {
                        dragSection.current = section.id;
                        e.dataTransfer.setData('application/x-c3-sidebar-section', section.id);
                      }}
                      onDragEnd={() => {
                        dragSection.current = null;
                      }}
                      aria-expanded={!collapsed}
                      onClick={() =>
                        change(
                          (p) => ({ ...p, collapsed: toggleId(p.collapsed, section.id) }),
                          `${section.label} ${collapsed ? 'expandida' : 'recolhida'}`
                        )
                      }
                      sx={{ flex: 1, justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {collapsed ? '▸' : '▾'} {section.label} ({count}) {pending > 0 && `· ${pending} pendentes`}
                    </Button>
                    <IconButton
                      size="small"
                      aria-label={`Ações da seção ${section.label}`}
                      onClick={(e) => setMenu({ anchor: e.currentTarget, section })}
                    >
                      ⋯
                    </IconButton>
                  </Box>
                  {!collapsed && (
                    <Box
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const source = visible.find((i) => i.id === e.dataTransfer.getData('application/x-c3-sidebar-item'));
                        if (source) {
                          e.preventDefault();
                          e.stopPropagation();
                          move(source, section.id);
                        }
                      }}
                    >
                      {children.length ? (
                        children.map(row)
                      ) : (
                        <Box sx={{ p: 1 }}>
                          <Typography variant="body2">Seção vazia</Typography>
                          <Button
                            size="small"
                            onClick={() => {
                              const first = visible[0];
                              if (first) setMenu({ anchor: heading.current!, item: first });
                              else addSection();
                            }}
                          >
                            {visible.length ? 'Mover item para seção' : 'Criar seção'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
            {!visible.length && <Typography sx={{ p: 2 }}>{props.empty ?? 'Nenhum item nesta lista.'}</Typography>}
          </>
        )}
      </Box>
      <SidebarFooter
        cards={props.cards}
        dismissed={prefs.dismissed}
        onDismiss={(id) => change((p) => ({ ...p, dismissed: [...p.dismissed, id] }), 'Aviso dispensado')}
        onCardAction={(id, action) => run(() => props.onCardAction?.(id, action))}
        onOverflowAlert={props.onOverflowAlert}
      />
      <Box role="status" aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        {announcement}
      </Box>
      <SidebarMenus controller={controller} props={props} />
      {editor && (
        <SidebarEditor
          title={editor.title}
          initial={editor.initial}
          onClose={() => setEditor(undefined)}
          onSave={(name) => {
            editor.save(name);
            setEditor(undefined);
          }}
        />
      )}
    </Box>
  );
}
