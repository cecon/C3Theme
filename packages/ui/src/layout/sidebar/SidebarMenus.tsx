import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { moveId } from './preferences';
import type useSidebarController from './useSidebarController';
import type { SectionSidebarProps } from './types';
export default function SidebarMenus({
  controller,
  props
}: {
  controller: ReturnType<typeof useSidebarController>;
  props: SectionSidebarProps;
}) {
  const {
    prefs,
    pinned,
    visible,
    assigned,
    sections,
    sectionIds,
    menu,
    menuItem,
    menuSection,
    closeMenu,
    selectAction,
    pin,
    move,
    change,
    run,
    setEditor
  } = controller;
  return (
    <Menu open={!!menu} anchorEl={menu?.anchor} onClose={closeMenu}>
      {menuItem && [
        <MenuItem key="pin" onClick={() => selectAction(() => pin(menuItem))}>
          {prefs.pinned.includes(menuItem.id) ? 'Desafixar' : 'Fixar'}
        </MenuItem>,
        ...[-1, 1].map((delta) => (
          <MenuItem
            key={delta}
            onClick={() =>
              selectAction(() => {
                const ids = prefs.pinned.includes(menuItem.id)
                  ? pinned.map((i) => i.id)
                  : visible.filter((i) => assigned(i) === assigned(menuItem)).map((i) => i.id);
                const order = moveId(ids, menuItem.id, delta);
                change(
                  (p) => ({
                    ...p,
                    ...(prefs.pinned.includes(menuItem.id)
                      ? { pinned: order }
                      : { order: [...order, ...visible.map((i) => i.id).filter((id) => !order.includes(id))] })
                  }),
                  `${menuItem.label}: posição ${order.indexOf(menuItem.id) + 1}`
                );
              })
            }
          >
            {delta < 0 ? 'Mover para cima' : 'Mover para baixo'}
          </MenuItem>
        )),
        ...sections.map((s) => (
          <MenuItem key={s.id} disabled={assigned(menuItem) === s.id} onClick={() => selectAction(() => move(menuItem, s.id))}>
            Mover para {s.label}
          </MenuItem>
        )),
        ...(menuItem.actions ?? []).map((a) => (
          <MenuItem key={`action-${a.id}`} onClick={() => selectAction(() => run(() => props.onAction?.(menuItem.id, a.id)))}>
            {a.label}
          </MenuItem>
        )),
        <MenuItem
          key="hide"
          onClick={() => selectAction(() => change((p) => ({ ...p, hidden: [...p.hidden, menuItem.id] }), `${menuItem.label} ocultada`))}
        >
          Ocultar
        </MenuItem>
      ]}
      {menuSection && [
        ...[-1, 1].map((delta) => (
          <MenuItem
            key={delta}
            onClick={() =>
              selectAction(() =>
                change((p) => ({ ...p, sectionOrder: moveId(sectionIds, menuSection.id, delta) }), 'Ordem das seções alterada')
              )
            }
          >
            {delta < 0 ? 'Mover seção para cima' : 'Mover seção para baixo'}
          </MenuItem>
        )),
        ...(menuSection.editable
          ? [
              <MenuItem
                key="rename"
                onClick={() =>
                  selectAction(() =>
                    setEditor({
                      title: 'Renomear seção',
                      initial: menuSection.label,
                      save: (name) => change((p) => ({ ...p, names: { ...p.names, [menuSection.id]: name } }), `Seção ${name}`)
                    })
                  )
                }
              >
                Renomear seção
              </MenuItem>,
              <MenuItem
                key="delete"
                disabled={!prefs.sections.some((s) => s.id === menuSection.id)}
                onClick={() =>
                  selectAction(() =>
                    change(
                      (p) => ({ ...p, sections: p.sections.filter((s) => s.id !== menuSection.id) }),
                      'Seção excluída; itens devolvidos à lista'
                    )
                  )
                }
              >
                Excluir seção
              </MenuItem>
            ]
          : [])
      ]}
    </Menu>
  );
}
