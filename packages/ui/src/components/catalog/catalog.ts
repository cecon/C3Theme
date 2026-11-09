import type { ReactNode } from 'react';

/** Tipo do item: agente pronto, habilidade ou app (o WhatsApp é um app). */
export type CatalogKind = 'agent' | 'skill' | 'app';

/** Situação do item neste computador. Quem decide é o app; o componente só mostra. */
export type CatalogStatus =
  | { state: 'available' }
  /** `progress` de 0 a 100; sem ele a barra fica indeterminada. */
  | { state: 'installing'; progress?: number }
  | { state: 'installed' }
  /** `version`: a versão nova que o catálogo oferece. */
  | { state: 'update-available'; version: string }
  /** Instalado aqui, mas o item saiu do catálogo: continua abrindo, não recebe mais atualização. */
  | { state: 'removed-from-catalog' }
  | { state: 'error'; message?: string };

export type CatalogState = CatalogStatus['state'];

export interface CatalogVersion {
  version: string;
  /** Já formatada pelo app ("12/10/2026"). */
  date?: string;
  notes?: string;
}

export interface CatalogItem {
  id: string;
  kind: CatalogKind;
  name: string;
  summary: string;
  version: string;
  author?: string;
  /** Ícone do item; sem ele aparecem as iniciais do nome. */
  icon?: ReactNode;
  category?: string;
  status: CatalogStatus;
  /** Descrição longa em Markdown (vai para o `renderMarkdown` do detalhe). */
  description?: string;
  /** O que o item instala. */
  files?: string[];
  permissions?: string[];
  /** Da mais nova para a mais velha. */
  versions?: CatalogVersion[];
  /** Arquivos que a pessoa editou à mão: na atualização a versão nova fica ao lado como `<arquivo>.nova`. */
  editedFiles?: string[];
  /**
   * Texto da ação principal só deste item, no lugar de Instalar/Atualizar/Abrir/Tentar de novo (ex.: agente que se
   * contrata de novo: "Contratar", "Contratar outro" com o estado `available`). Não vale enquanto instala.
   */
  actionLabel?: string;
}

/** Callbacks para o app. O componente não faz chamada nenhuma; sem o callback, o botão não aparece. */
export interface CatalogActions {
  onInstall?: (item: CatalogItem) => void;
  onUpdate?: (item: CatalogItem) => void;
  onOpen?: (item: CatalogItem) => void;
  onRetry?: (item: CatalogItem) => void;
  onRemove?: (item: CatalogItem) => void;
}

/** Ações por tipo de item: ação sem callback naquele tipo não aparece (ex.: só o app abre, só a habilidade sai). */
export type CatalogActionsByKind = Partial<Record<CatalogKind, CatalogActions>>;

/** O que `actions` aceita: os mesmos callbacks para todos os tipos, ou um objeto por tipo. */
export type CatalogActionsProp = CatalogActions | CatalogActionsByKind;

const KINDS: CatalogKind[] = ['agent', 'skill', 'app'];

const isByKind = (actions: CatalogActionsProp): actions is CatalogActionsByKind => KINDS.some((k) => k in actions);

/**
 * Callbacks que valem para o item. Com qualquer chave de tipo (`agent`, `skill`, `app`), vale só o objeto do tipo do
 * item (tipo ausente: nenhuma ação) e os callbacks soltos são ignorados; sem chave de tipo, valem para todos.
 */
export function actionsFor(actions: CatalogActionsProp | undefined, kind: CatalogKind): CatalogActions {
  if (!actions) return {};
  return isByKind(actions) ? (actions[kind] ?? {}) : actions;
}

export type CatalogPrimary = 'install' | 'update' | 'open' | 'retry' | 'installing';

/** Ação principal pelo estado: Instalar, Atualizar, Abrir, Tentar de novo; instalando não tem ação. */
export function primaryAction(status: CatalogStatus): CatalogPrimary {
  switch (status.state) {
    case 'available':
      return 'install';
    case 'installing':
      return 'installing';
    case 'update-available':
      return 'update';
    case 'error':
      return 'retry';
    default:
      return 'open';
  }
}

const CALLBACK: Record<Exclude<CatalogPrimary, 'installing'>, keyof CatalogActions> = {
  install: 'onInstall',
  update: 'onUpdate',
  open: 'onOpen',
  retry: 'onRetry'
};

/** Callback da ação principal, ou `undefined` quando o app não passou (ou está instalando). */
export function primaryCallback(status: CatalogStatus, actions: CatalogActions) {
  const action = primaryAction(status);
  return action === 'installing' ? undefined : actions[CALLBACK[action]];
}

/** Está neste computador: dá para abrir e remover. */
export const isInstalled = (status: CatalogStatus) =>
  status.state === 'installed' || status.state === 'update-available' || status.state === 'removed-from-catalog';

/** Tira acento e caixa para a busca achar "clinica" em "Clínica". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export interface CatalogFilter {
  kind?: CatalogKind | 'all';
  query?: string;
}

/** Filtra por tipo e por busca (todas as palavras no nome, resumo, autor ou categoria). */
export function filterCatalog(items: CatalogItem[], { kind = 'all', query = '' }: CatalogFilter) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false;
    if (!words.length) return true;
    const text = fold([item.name, item.summary, item.author, item.category].filter(Boolean).join(' '));
    return words.every((w) => text.includes(w));
  });
}

/** Quantos itens de cada tipo (para os contadores do filtro). */
export function countByKind(items: CatalogItem[]): Record<CatalogKind | 'all', number> {
  const counts = { all: items.length, agent: 0, skill: 0, app: 0 };
  for (const item of items) counts[item.kind] += 1;
  return counts;
}

export interface CatalogGroup {
  /** `undefined`: itens sem categoria, que vão no fim. */
  category?: string;
  items: CatalogItem[];
}

/** Agrupa por categoria na ordem em que cada uma aparece; sem categoria fica por último. */
export function groupByCategory(items: CatalogItem[]): CatalogGroup[] {
  const groups = new Map<string | undefined, CatalogItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  const named = [...groups].filter(([c]) => c !== undefined).map(([category, list]) => ({ category, items: list }));
  const rest = groups.get(undefined);
  return rest ? [...named, { items: rest }] : named;
}
