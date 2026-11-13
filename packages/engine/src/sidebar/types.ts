import type { Text } from '../types';

export interface SidebarDef {
  source: string;
  label: Text;
  title: Text;
  hidden?: boolean;
  empty?: Text;
  sections: { id: string; label: Text; editable?: boolean }[];
  cards?: { id: string; label: Text; message?: Text; dismissible?: boolean; action: { id: string; label: Text } }[];
}
export interface SidebarSnapshot {
  /** Identidade estável do servidor: isola as preferências locais. */
  serverId: string;
  loading?: boolean;
  error?: string;
  active?: string;
  view?: string;
  views?: { id: string; label: Text }[];
  sections?: SidebarDef['sections'];
  items: {
    id: string;
    label: Text;
    section: string;
    icon?: string;
    status?: Text;
    pending?: number;
    path?: string;
    actions?: { id: string; label: Text }[];
  }[];
  cards?: { id: string; severity: 'ok' | 'warning' | 'critical'; message?: Text }[];
}
export interface SidebarPort {
  /** Retorne o mesmo snapshot até haver uma alteração, como useSyncExternalStore. */
  getSnapshot: () => SidebarSnapshot;
  subscribe: (listener: () => void) => () => void;
  select?: (id: string) => void;
  setView?: (id: string) => void;
  action?: (id: string, action: string) => void | Promise<void>;
  cardAction?: (id: string, action: string) => void | Promise<void>;
  retry?: () => void;
  overflowAlert?: (active: boolean) => void;
}
