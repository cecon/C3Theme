import type { ComponentType, ReactNode } from 'react';

/** Estado de conexão de um servidor no rail (#116). Sem depender só de cor. */
export type ServerConnectionState = 'online' | 'connecting' | 'offline' | 'error' | 'incompatible' | 'sleeping' | 'waking';

/** Rótulo curto do estado, para o tooltip e o nome acessível. */
export const SERVER_STATE_LABEL: Readonly<Record<ServerConnectionState, string>> = {
  online: 'online',
  connecting: 'conectando',
  offline: 'offline',
  error: 'com erro',
  incompatible: 'incompatível',
  waking: 'acordando',
  sleeping: 'dormindo'
};

/** Um servidor da conta, como o rail desenha (#116). */
export interface ServerRailItem {
  readonly id: string;
  readonly name: string;
  readonly state: ServerConnectionState;
  /** Marca visual do servidor: ícone, imagem ou inicial. Sem ela, a inicial do nome. */
  readonly icon?: ComponentType<{ size?: number | string; variant?: 'Linear' | 'Bulk' | 'TwoTone' }>;
  readonly imageUrl?: string;
  /** Detalhe do estado, mostrado no tooltip (ex.: "Reconectando em 5 s"). */
  readonly detail?: string;
  /** Rótulo curto do papel, como "Este computador". */
  readonly badge?: string;
}

/** Opção de adicionar servidor, declarada pela spec (#116). */
export interface ServerAddOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: ComponentType<{ size?: number | string }>;
}

/** Ação do menu de um servidor (#116). */
export interface ServerAction {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly instruction?: string;
  /** Separador antes desta ação. */
  readonly divider?: boolean;
}

/** O que o app entrega ao rail por porta (#116). */
export interface ServerRailPort {
  readonly servers: readonly ServerRailItem[];
  readonly activeId?: string;
  readonly state?: 'loading' | 'ready' | 'error';
  readonly errorMessage?: string;
  readonly addOptions?: readonly ServerAddOption[];
  readonly actions?: (server: ServerRailItem) => readonly ServerAction[];
  /** Servidor local oculto, quando a pessoa o escondeu: o menu de adicionar oferece reexibir. */
  readonly hiddenLocal?: ServerRailItem;
  readonly shortcut?: boolean;
}

export interface ServerRailProps extends ServerRailPort {
  readonly localServerId?: string;
  /** Preferências: ordem local e servidor local oculto. */
  readonly storageKey?: string;
  readonly onSelect: (id: string) => void;
  readonly onAdd?: (optionId?: string) => void;
  readonly onShowLocal?: () => void;
  readonly onAction?: (serverId: string, actionId: string) => void;
  readonly onRetry?: () => void;
  readonly onReorder?: (ids: readonly string[]) => void;
  /** Anúncio em região viva (reordenação, ocultação). */
  readonly onAnnounce?: (message: string) => void;
  /** Nomes já traduzidos; sem eles, os padrões em português. */
  readonly labels?: Partial<ServerRailLabels>;
  readonly className?: string;
}

export interface ServerRailLabels {
  readonly navigation: string;
  readonly add: string;
  readonly actions: string;
  readonly loading: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly errorTitle: string;
  readonly retry: string;
  readonly showLocal: (name: string) => string;
  readonly moveUp: string;
  readonly moveDown: string;
  readonly shortcuts: string;
}

export const SERVER_RAIL_DEFAULT_LABELS: ServerRailLabels = {
  navigation: 'Servidores',
  add: 'Adicionar servidor',
  actions: 'Ações do servidor',
  loading: 'Carregando servidores',
  emptyTitle: 'Nenhum servidor',
  emptyDescription: 'Adicione um servidor para começar a trabalhar.',
  errorTitle: 'Não foi possível carregar os servidores',
  retry: 'Tentar de novo',
  showLocal: (name) => `Reexibir ${name}`,
  moveUp: 'Mover para cima',
  moveDown: 'Mover para baixo',
  shortcuts: 'Atalhos de 1 a 9 selecionam o servidor na posição'
};

/** Uma página do rail de páginas (#117). */
export interface PageRailItem {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly icon?: ComponentType<{ size?: number | string; variant?: 'Linear' | 'Bulk' }>;
  readonly badge?: ReactNode;
  /** Página que não pode ser desafixada (ex.: a primeira). */
  readonly fixed?: boolean;
}

/** Bloco opcional do rail de páginas (#117). */
export interface PageRailBlock {
  readonly id: string;
  readonly label: string;
  readonly icon?: ComponentType<{ size?: number | string; variant?: 'Linear' | 'Bulk' }>;
  readonly onClick?: () => void;
  readonly badge?: ReactNode;
}

export interface PageRailHelp {
  readonly version: string;
  readonly releaseNotes?: string | null;
  readonly loadingNotes?: boolean;
  readonly links: readonly { readonly label: string; readonly href: string }[];
}

/** O que o app entrega ao rail de páginas por porta (#117). */
export interface PageRailPort {
  readonly pages: readonly PageRailItem[];
  readonly activePath?: string;
  /** Páginas postas no rail pela pessoa; sem isso, a declaração da spec. */
  readonly pinned?: readonly string[];
  readonly blocks?: readonly PageRailBlock[];
  readonly help?: PageRailHelp;
  readonly brand?: { readonly label: string; readonly href?: string };
  /** Marca sai de cena quando a moldura desenha os controles da janela naquela faixa. */
  readonly hideBrand?: boolean;
  /** O rail inteiro some sem reservar espaço. */
  readonly hidden?: boolean;
}
