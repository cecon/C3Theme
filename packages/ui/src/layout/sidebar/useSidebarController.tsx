import { useEffect, useMemo, useRef, useState } from 'react';
import SidebarRow from './SidebarRow';
import { ordered, readPreferences, savePreferences, toggleId } from './preferences';
import type { SectionSidebarProps, SidebarItem, SidebarPreferences, SidebarSection } from './types';
export default function useSidebarController(props: SectionSidebarProps) {
  const { storageKey, items, active } = props;
  const [prefs, setPrefs] = useState(() => readPreferences(storageKey));
  const [announcement, announce] = useState('');
  const [failure, setFailure] = useState('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; item?: SidebarItem; section?: SidebarSection }>();
  const [editor, setEditor] = useState<{ title: string; initial: string; save: (name: string) => void }>();
  const dragSection = useRef<string | null>(null);
  const heading = useRef<HTMLButtonElement>(null);
  useEffect(() => savePreferences(storageKey, prefs), [storageKey, prefs]);
  const change = (update: (p: SidebarPreferences) => SidebarPreferences, message: string) => {
    setPrefs(update);
    announce(message);
  };
  const sections = useMemo(
    () =>
      ordered(
        [
          ...props.sections,
          ...prefs.sections.filter((s) => !props.sections.some((base) => base.id === s.id)),
          ...(props.sections.length === 0 && prefs.sections.length === 0 && items.length ? [{ id: '__unassigned', label: 'Itens' }] : [])
        ],
        prefs.sectionOrder
      ).map((s) => ({ ...s, label: (Object.hasOwn(prefs.names, s.id) ? prefs.names[s.id] : undefined) ?? s.label })),
    [props.sections, prefs, items.length]
  );
  const visible = ordered(
    items.filter((i) => !prefs.hidden.includes(i.id)),
    prefs.order
  );
  const assigned = (item: SidebarItem) => {
    const target = (Object.hasOwn(prefs.moved, item.id) ? prefs.moved[item.id] : undefined) ?? item.section;
    return sections.some((s) => s.id === target) ? target : sections[0]?.id;
  };
  const pinned = ordered(
    visible.filter((i) => prefs.pinned.includes(i.id)),
    prefs.pinned
  );
  const pin = (item: SidebarItem) =>
    change(
      (p) => ({ ...p, pinned: toggleId(p.pinned, item.id) }),
      `${item.label}: ${prefs.pinned.includes(item.id) ? 'desafixada' : 'fixada'}`
    );
  const move = (item: SidebarItem, section: string, before?: string) => {
    const ids = visible.map((i) => i.id).filter((id) => id !== item.id);
    const index = before ? ids.indexOf(before) : -1;
    ids.splice(index < 0 ? ids.length : index, 0, item.id);
    change(
      (p) => ({ ...p, moved: { ...p.moved, [item.id]: section }, order: ids }),
      `${item.label} movida para ${sections.find((s) => s.id === section)?.label ?? section}`
    );
  };
  const run = (action: () => void | Promise<void>) => {
    setFailure('');
    Promise.resolve()
      .then(action)
      .catch(() => setFailure('Não foi possível concluir a ação. Tente de novo.'));
  };
  const row = (item: SidebarItem) => (
    <SidebarRow
      key={item.id}
      item={item}
      pinned={prefs.pinned.includes(item.id)}
      active={active === item.id}
      onSelect={() => props.onSelect(item.id)}
      onPin={() => pin(item)}
      onMenu={(anchor) => setMenu({ anchor, item })}
      onMove={(id) => {
        if (id === item.id) return;
        const source = visible.find((i) => i.id === id);
        if (source) {
          if (prefs.pinned.includes(item.id) && prefs.pinned.includes(source.id)) {
            const order = pinned.map((i) => i.id).filter((x) => x !== id);
            order.splice(order.indexOf(item.id), 0, id);
            change((p) => ({ ...p, pinned: order }), `${source.label}: ordem dos fixados alterada`);
          } else move(source, assigned(item)!, item.id);
        }
      }}
    />
  );
  const addSection = () =>
    setEditor({
      title: 'Criar seção',
      initial: '',
      save: (name) => {
        const id = `custom-${globalThis.crypto.randomUUID()}`;
        change((p) => ({ ...p, sections: [...p.sections, { id, label: name, editable: true }] }), `Seção ${name} criada`);
      }
    });
  const closeMenu = () => {
    const anchor = menu?.anchor;
    setMenu(undefined);
    requestAnimationFrame(() => (anchor?.isConnected ? anchor : heading.current)?.focus());
  };
  const selectAction = (action: () => void) => {
    closeMenu();
    action();
  };
  const menuItem = menu?.item;
  const menuSection = menu?.section;
  const sectionIds = sections.map((s) => s.id);
  return {
    prefs,
    announcement,
    failure,
    menu,
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
    pin,
    move,
    run,
    row,
    addSection,
    closeMenu,
    selectAction,
    menuItem,
    menuSection,
    sectionIds
  };
}
