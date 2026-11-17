import type { ReactNode } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  mark?: ReactNode;
  /** Iniciais do `label` sobre a cor (hex), no lugar do `mark` (#135). */
  avatar?: SidebarAvatar;
  /** Presença/atividade também vira texto acessível, nunca apenas cor. */
  status?: string;
  pending?: number;
  section: string;
  actions?: { id: string; label: string }[];
}
export interface SidebarAvatar {
  /** Nome de onde saem as iniciais (até duas). */
  label: string;
  /** Cor de fundo em hex (`#3366ff`); o texto escolhe claro ou escuro pelo contraste. Sem ela, a cor neutra do tema. */
  color?: string;
}
/** Busca no cabeçalho (#135): filtra por nome e resumo, sem mexer nas preferências. */
export interface SidebarSearchDef {
  /** Nome acessível do campo. */
  label: string;
  placeholder?: string;
  /** Texto quando nada casa; padrão: `Nada encontrado para "…".` */
  empty?: string;
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
  search?: SidebarSearchDef;
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
