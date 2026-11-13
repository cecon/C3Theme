import type { ReactNode } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  mark?: ReactNode;
  /** Presença/atividade também vira texto acessível, nunca apenas cor. */
  status?: string;
  pending?: number;
  section: string;
  actions?: { id: string; label: string }[];
}
export interface SidebarSection {
  id: string;
  label: string;
  editable?: boolean;
  pending?: number;
}
export interface SidebarCard {
  id: string;
  label: string;
  message?: string;
  severity: 'ok' | 'warning' | 'critical';
  action: { label: string; id: string };
  dismissible?: boolean;
}
export interface SectionSidebarProps {
  /** Escopo da preferência: nunca compartilha ordem entre servidores. */
  storageKey: string;
  label: string;
  title: string;
  sections: SidebarSection[];
  items: SidebarItem[];
  views?: { id: string; label: string }[];
  view?: string;
  onView?: (id: string) => void;
  active?: string;
  onSelect: (id: string) => void;
  onAction?: (id: string, action: string) => void | Promise<void>;
  cards?: SidebarCard[];
  onCardAction?: (id: string, action: string) => void | Promise<void>;
  /** O app pode marcar Configurações quando o cartão não couber. */
  onOverflowAlert?: (active: boolean) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  empty?: string;
}
export interface SidebarPreferences {
  collapsed: string[];
  pinned: string[];
  hidden: string[];
  order: string[];
  sectionOrder: string[];
  sections: SidebarSection[];
  moved: Record<string, string>;
  names: Record<string, string>;
  dismissed: string[];
}
