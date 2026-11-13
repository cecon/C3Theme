// Tipos dos documentos da spec v0 (spec/v0/*.schema.json), do lado da shell.

import type { Condition, FieldType } from './conditions.mjs';
import type { DocumentFormat } from './documents.mjs';
import type { AuthConfig } from './auth/port';
import type { AppSettingsDef } from './settingsTypes';
import type { DashboardDef } from './dashboard';
import type { BoardView, CalendarView, ColumnDef, FlowView, GalleryView, ListLook, ListOpening, MapView, ReportView } from './viewTypes';
import type { ActionDef, ActionPreview, GridFieldDef } from './actionTypes';
import type { FormView, LookupDef } from './formTypes';
import type { WizardDef } from './wizard';
import type { ChatDef } from './chat/chatDef';
import type { AuthorizationConfig } from './authorization/AuthorizationDialog';
import type { DesktopDef } from './desktop/frame';

export type { Condition, FieldType };
export type { BoardView, CalendarView, ReportView };
export type { ActionDef, ActionPreview, GridFieldDef };

export type Text = string | { id: string; defaultMessage?: string };

export type Tone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger';

export type EnumValue = string | number;

export interface FieldDef {
  name: string;
  type: FieldType;
  label?: Text;
  help?: Text;
  /** Ajuda longa atrás de uma interrogação no rótulo; o `help` é a frase curta sempre visível. */
  hint?: Text;
  /** Sinônimos que a busca das configurações também acha (`views.form.search`). */
  keywords?: Text[];
  /** Gravação na hora: pergunta antes do PATCH; cancelar volta o valor. `when` sobre o valor novo. */
  confirmChange?: { message: Text; effect?: Text; confirmLabel?: Text; when?: Condition };
  /** Gravação na hora: a mudança só vale depois de reiniciar; o texto (ou o padrão) aparece depois do Salvo. */
  restart?: true | Text;
  /** Valor preenchido pelo assistente pede conferência: o rascunho só grava depois de o usuário confirmar o campo. */
  aiReview?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /** Só na criação; depois aparece travado. */
  createOnly?: boolean;
  /** Trava na alteração quando vale para o registro gravado (não para o formulário). */
  readOnlyWhen?: Condition;
  /** Senha, PIN: a leitura sempre traz null e vazio na alteração mantém o gravado. */
  writeOnly?: boolean;
  unique?: boolean;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** CPF/CNPJ com dígito verificador; trafega sem máscara. */
  format?: DocumentFormat;
  min?: number;
  max?: number;
  scale?: number;
  /** Só em decimal: código ISO 4217; a shell mostra com o símbolo da moeda. */
  currency?: string;
  /** Só em integer e decimal: texto depois do número ("%", "kg"), no campo e na leitura. */
  unit?: string;
  /** Só em integer: `false` mostra sem separador de milhar (porta, ano, código). */
  grouping?: boolean;
  /** Só em integer e decimal: número negativo nesse tom na lista, no relatório e na impressão. */
  negativeTone?: 'error' | 'warning';
  /** O valor como o banco grava (texto ou inteiro), sem tradução; o `label` é o que a tela mostra. */
  options?: { value: EnumValue; label: Text; color?: Tone }[];
  /** Só em string: campo text do mesmo registro com as opções em JSON; com a lista, a tela mostra um select. */
  optionsFrom?: string;
  entity?: string;
  /** `file`: extensões aceitas, com ponto (".pfx"). */
  accept?: string[];
  /** `file`: tamanho máximo em bytes (padrão 1 MB). */
  maxSize?: number;
  /** Só em reference: condição sobre a entidade apontada; `{"$field": nome}` usa o valor do formulário. */
  filter?: Condition;
  visibleWhen?: Condition;
  requiredWhen?: Condition;
  /** Códigos de permissão para ver e para alterar (somados aos da seção). */
  access?: Access;
  /** Só da shell, de capabilities.fields: 'hidden' vira readOnly e some das telas; 'readOnly' aparece travado. */
  denied?: Denied;
}

/** Valor de um campo `file`: o arquivo inteiro, em base64. */
export type { FileValue } from '@c3theme/ui';

export interface Access {
  view?: string;
  edit?: string;
}

/** O que o usuário não pode com um campo ou lista with_parent (capabilities.fields). */
export type Denied = 'hidden' | 'readOnly';

export type {
  CalendarColor,
  ColumnDef,
  ExpandItem,
  GalleryView,
  ListExpand,
  ListLook,
  ListOpening,
  RecordImageDef,
  RowAction,
  RowStyle
} from './viewTypes';
export type {
  ClientPlatform,
  ComputedValue,
  FormFieldDef,
  FormSection,
  FormView,
  PairingDef,
  PairingState,
  RelatedDef,
  SummaryLine
} from './formTypes';
export type { LookupDef } from './formTypes';

export interface Preset {
  id: string;
  label: Text;
  /** Sem `where`, é o "Todos": só o recorte da tela (#67). */
  where?: Condition;
  default?: boolean;
  /** Valores iniciais do registro novo criado com este filtro ativo. */
  defaults?: WireRecord;
}

/** Dono dos registros (spec: `scope`). Só vale quando o app declara `organization`. */
export type Scope = 'group' | 'company' | 'branch';

export interface EntityDef {
  name: string;
  scope?: Scope;
  /** false: nenhum Desfazer (documento fiscal), nem de gravação nem de ação. */
  undoable?: boolean;
  /** Registro único por escopo (configuração): /{entity} abre o formulário dele, sem lista. */
  singleton?: boolean;
  /** Tempo real: a tela aberta relê a cada aviso do servidor; `sound.on` toca um som (pedido novo no KDS). */
  live?: boolean | { sound?: { on: ('created' | 'updated')[] } };
  /** Consulta do sistema: sem tabela, só leitura, com `params` pedidos antes; `paramDefaults` (resolvidos) vem do /_meta. */
  source?: 'system';
  params?: { fields: FieldDef[] };
  paramDefaults?: WireRecord;
  label: { singular: Text; plural: Text; new?: Text; gender?: 'm' | 'f' };
  description?: Text;
  icon?: string;
  titleField?: string;
  fields: FieldDef[];
  views?: {
    list?: ListLook & {
      columns?: ColumnDef[];
      search?: string[];
      filters?: (string | { field: string; all?: Text })[];
      presets?: Preset[];
      defaultSort?: { field: string; direction?: 'asc' | 'desc' }[];
      pageSize?: 10 | 25 | 50 | 100;
      /** Relê a página a cada N segundos (mínimo 3), só com a aba visível. */
      refreshSeconds?: number;
      /** `ratio`: Σ numerator ÷ Σ denominator × factor (margem %), vazio quando o denominador soma zero. */
      totals?: { field: string; measure?: 'sum' | 'ratio'; numerator?: string; denominator?: string; factor?: number }[];
      /** Linha "Saldo anterior" no topo, com o período filtrado (ver `useListOpening`). */
      opening?: ListOpening;
    };
    form?: FormView;
    gallery?: GalleryView;
    detail?: { component?: string };
    board?: BoardView;
    calendar?: CalendarView;
    report?: ReportView;
    map?: MapView;
    flow?: FlowView;
  };
  actions?: ActionDef[];
  lookups?: LookupDef[];
  /** Linhas que cada código de permissão enxerga; o backend filtra, a shell só repassa. */
  rowAccess?: { permission: string; where: Condition }[];
}

/** Telas de uma entidade que o menu e a troca de visão abrem. */
export type EntityViewKind = 'list' | 'gallery' | 'board' | 'calendar' | 'report' | 'map';

export interface Capabilities {
  list: boolean;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  /** Uma chave por ação; ausente (backend anterior às ações) vale como sem permissão. */
  actions?: Record<string, boolean>;
  /** Campos e listas with_parent que o usuário não vê ou só lê; ausente, tudo livre. */
  fields?: Record<string, Denied>;
}

export interface LinkDef {
  label: Text;
  icon?: string;
  path?: string;
  href?: string;
}

export interface MenuItemDef {
  entity?: string;
  preset?: string;
  view?: EntityViewKind;
  /** Mostra no menu quantos registros a lista (com o preset) tem: fila de pendências. */
  badge?: boolean;
  path?: string;
  href?: string;
  title?: Text;
  icon?: string;
  children?: MenuItemDef[];
}

export interface PageDef {
  states?: import('./pageStates/types').PageStates;
  path: string;
  title?: Text;
  component?: string;
  /** Configuração da página registrada, validada pelo schema do componente no spec:check. */
  config?: Record<string, unknown>;
  permission?: string;
  dashboard?: DashboardDef;
  /** Documentação da API (openapi.json servido pelo app), com busca e "experimentar". */
  apiDocs?: { spec: string };
  /** Tela que ainda não está pronta: "Em breve" no lugar dela, com o menu em volta. */
  comingSoon?: { message?: Text; until?: string };
  /** Assistente em passos sobre um registro único, com resumo e a guarda que prende o app até terminar. */
  wizard?: WizardDef;
  /** Página de chat com o agente do sistema (spec/v0/chat.yaml, ADR 0006). */
  chat?: ChatDef;
  layout?: 'dashboard' | 'blank';
}

export interface AppDef {
  name: string;
  status?: import('./status/AppStatus').AppStatusDef;
  homePath?: string;
  /** Telas de entrada montadas pela shell (com a porta `auth` do <C3Shell>). */
  auth?: AuthConfig;
  entities: string[];
  organization?: { company: string; branch: string };
  /** Página com `component` (página registrada, com `config` e `permission`) ou `dashboard` (montado pela shell). */
  pages?: PageDef[];
  /** Configurações em modal (#119): abas pessoais, seções do servidor, busca e foco preso. */
  settings?: AppSettingsDef;
  /** Autorização de outro usuário: códigos de erro que abrem o diálogo e os campos dele. */
  authorization?: AuthorizationConfig;
  layout: {
    sidebar?: import('./sidebar/types').SidebarDef;
    agentDock?: import('./dock/types').AgentDockDef;
    orientation?: 'vertical' | 'horizontal' | 'rail';
    /** Onde fica o usuário logado: avatar no cabeçalho (padrão) ou cartão no pé do menu lateral. */
    user?: 'header' | 'drawer';
    header?: {
      /** `false` tira o Ctrl K; `{ records: true }` também busca registros e mensagens no backend (GET /_search). */
      search?: boolean | { records?: boolean };
      fullscreen?: boolean;
      settings?: boolean;
      notifications?: boolean;
      /** Botão do assistente: abre o chat com o agente numa gaveta. */
      assistant?: boolean | ChatDef;
      languages?: string[];
      userMenu?: LinkDef[];
      actions?: string[];
    };
    menu: { title?: Text; items: MenuItemDef[] }[];
    footer?: { text?: Text; links?: LinkDef[] } | null;
    /** Moldura da janela de desktop; só vale com a porta `desktopHost` do <C3Shell>. */
    desktop?: DesktopDef;
    /** Zonas opcionais da casca, com dados e ações pela porta rails. */
    rails?: import('./railsTypes').RailsDef;
  };
}
/** Registro no formato trafegado. Reference lido vem { id, title }. */
export type WireRecord = Record<string, unknown> & {
  id?: string;
  /** Empresa e filial donas (entidade com scope). */
  _company?: RefValue;
  _branch?: RefValue;
  /** O que o usuário pode fazer com esta linha (entidade com scope). */
  _can?: { update: boolean; delete: boolean };
  /** Versão do registro como este usuário o vê: vai no If-Match de alterar, excluir, ação e Desfazer. */
  _version?: string;
};
/** title null: registro apontado fora do que o usuário pode ler. */
export type RefValue = { id: string; title: string | null };
/** GET /_meta/context: empresas e filiais que o usuário acessa. */
export interface OrgContext {
  organization: { company: string; branch: string } | null;
  companies: { id: string; title: string }[];
  branches: { id: string; title: string; company: string }[];
  activeBranch: string | null;
  defaultBranch: string | null;
}
// resultados de lista, ação e lote: resultTypes.ts
export type * from './resultTypes';
