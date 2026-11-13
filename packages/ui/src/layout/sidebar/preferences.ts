import type { SidebarCard, SidebarPreferences, SidebarSection } from './types';

export const blankPreferences = (): SidebarPreferences => ({
  collapsed: [],
  pinned: [],
  hidden: [],
  order: [],
  sectionOrder: [],
  sections: [],
  moved: {},
  names: {},
  dismissed: []
});
export function readPreferences(key: string): SidebarPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(`c3.sidebar.${key}`) ?? 'null');
    const blank = blankPreferences();
    if (!value || typeof value !== 'object') return blank;
    for (const field of ['collapsed', 'pinned', 'hidden', 'order', 'sectionOrder', 'dismissed'] as const)
      if (Array.isArray(value[field])) blank[field] = value[field].filter((id: unknown) => typeof id === 'string');
    if (Array.isArray(value.sections))
      blank.sections = value.sections.filter((s: SidebarSection) => s && typeof s.id === 'string' && typeof s.label === 'string');
    for (const field of ['moved', 'names'] as const)
      if (value[field] && typeof value[field] === 'object')
        blank[field] = Object.fromEntries(Object.entries(value[field]).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
    return blank;
  } catch {
    return blankPreferences();
  }
}
export function savePreferences(key: string, value: SidebarPreferences) {
  try {
    localStorage.setItem(`c3.sidebar.${key}`, JSON.stringify(value));
  } catch {
    /* sem armazenamento: a sessão continua */
  }
}
export const toggleId = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
export const ordered = <T extends { id: string }>(values: T[], ids: string[]) =>
  [...values].sort((a, b) => {
    const ai = ids.indexOf(a.id),
      bi = ids.indexOf(b.id);
    return (ai < 0 ? ids.length : ai) - (bi < 0 ? ids.length : bi);
  });
export function moveId(ids: string[], id: string, delta: number) {
  const next = [...ids],
    from = next.indexOf(id);
  if (from < 0) return next;
  const to = Math.max(0, Math.min(next.length - 1, from + delta));
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}
export function visibleCards(cards: SidebarCard[], dismissed: string[]) {
  const present = cards.filter((c) => !dismissed.includes(c.id));
  const alert = present.find((c) => c.severity === 'critical') ?? present.find((c) => c.severity === 'warning');
  return present.filter((c) => c.severity === 'ok' || c === alert);
}
