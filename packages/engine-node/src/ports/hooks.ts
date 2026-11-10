// Pontos de extensão do sistema (`Hooks`) e o que cada um recebe. Tudo tem padrão: sem hooks, todo mundo pode tudo
// (menos rodar ações, consultar fontes e baixar arquivos, que só o sistema sabe fazer).

import type { FieldErrors } from '../domain/errors';
import type { Clock } from '../domain/relative-date';
import type { Rec, SqlValue } from '../domain/types';
import type { EngineRequest } from './request';
import type { Conn, Store } from './store';

type Maybe<T> = T | Promise<T>;

/** O que o usuário atual pode fazer numa entidade (`/_meta/entities/{e}` e aplicado no CRUD). */
export interface Capabilities {
  list: boolean;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: true };
export const NONE: Capabilities = { list: false, read: false, create: false, update: false, delete: false };
export const READ_ONLY: Capabilities = { list: true, read: true, create: false, update: false, delete: false };

/** Filiais que o usuário enxerga (só vale quando o app declara `organization`). */
export interface OrgAccess {
  /** Ids das filiais permitidas; ausente = todas. */
  branches?: string[];
  /** Filial sugerida para abrir a sessão. */
  defaultBranch?: string;
}

/** Requisição em andamento, com a filial ativa já conferida contra as permitidas. */
export interface RequestContext {
  req: EngineRequest;
  activeBranch?: string;
  activeCompany?: string;
}

export type WriteOp = 'create' | 'update' | 'delete';

/** Uma linha filha a gravar. Empresa e filial donas são as do pai. */
export interface ChildRow {
  op: WriteOp;
  id?: number;
  /** Posição na lista enviada (alterar e incluir): erro volta em `{entity}.{index}.{campo}`. */
  index?: number;
  before?: Rec;
  /** Alterar e incluir: campos graváveis, validados, sem a coluna do pai. Excluir: vazio. */
  values: Rec;
}

/** Filhos de uma seção `related` com `save: with_parent`, na ordem excluir, alterar, incluir. */
export interface ChildWrite {
  entity: string;
  /** Coluna da filha que aponta para o pai. */
  field: string;
  rows: ChildRow[];
}

export interface WriteCall {
  entity: string;
  op: WriteOp;
  id?: number;
  before?: Rec;
  /** Criar e alterar: todo campo gravável, validado, no formato trafegado (reference só o id). */
  values: Rec;
  company?: number;
  branch?: number;
  children: ChildWrite[];
  ctx: RequestContext;
  store: Store;
}

export interface FileContent {
  name: string;
  contentType?: string;
  data: Uint8Array;
}

/** Resultado de uma ação: aviso, arquivo (`returns: "file"`) e o registro que a shell abre depois. */
export interface ActionOutcome {
  message?: string;
  file?: FileContent;
  open?: { entity?: string; id: string };
}

export interface ActionCall {
  entity: string;
  action: string;
  id: string;
  record: Rec;
  input: Rec;
  ctx: RequestContext;
  store: Store;
}

export interface BulkActionCall {
  entity: string;
  action: string;
  ids: string[];
  records: Rec[];
  input: Rec;
  /** Consulta do sistema (`source: system`): os parâmetros que valiam na lista (`p.<nome>` da URL). Vazio numa tabela. */
  params: Rec;
  ctx: RequestContext;
  store: Store;
}

export interface ListActionCall {
  entity: string;
  action: string;
  input: Rec;
  ctx: RequestContext;
  store: Store;
}

export interface PrefillCall {
  entity: string;
  action: string;
  id?: string;
  record?: Rec;
  ctx: RequestContext;
}

export interface PreviewCall {
  entity: string;
  action: string;
  id?: string;
  record?: Rec;
  ids: string[];
  input: Rec;
  ctx: RequestContext;
}

export interface Preview {
  message?: string;
  fill?: Rec;
  table?: { columns: { name: string; label: string }[]; rows: Rec[] };
}

export interface LookupCall {
  entity: string;
  lookup: string;
  value: string;
  ctx: RequestContext;
}

export interface FileCall {
  entity: string;
  id: string;
  field: string;
  ctx: RequestContext;
}

export interface SourceCall {
  entity: string;
  params: Rec;
  ctx: RequestContext;
}

/** O SELECT de uma consulta do sistema; os `?` casam com `values`. */
export interface SourceSql {
  sql: string;
  values: SqlValue[];
}

/** Os pontos de extensão (todos opcionais). Os síncronos rodam dentro da montagem do SQL. */
export interface Hooks {
  orgAccess?(req: EngineRequest): Maybe<OrgAccess>;
  capabilities?(entity: string, branch: string | undefined, req: EngineRequest): Capabilities;
  validate?(ctx: RequestContext, entity: string, record: Rec, conn: Conn, errors: FieldErrors): Maybe<void>;
  validateChildren?(ctx: RequestContext, entity: string, record: Rec, children: ChildWrite[], conn: Conn, errors: FieldErrors): Maybe<void>;
  delegatesWrites?(entity: string): boolean;
  write?(call: WriteCall): Promise<number>;
  actionAllowed?(entity: string, action: string, branch: string | undefined, req: EngineRequest): boolean;
  permitted?(code: string, branch: string | undefined, req: EngineRequest): boolean;
  /** Valor do usuário citado em `rowAccess` como `{"$user": chave}`; ausente/null: a regra não mostra nada. */
  userValue?(key: string, req: EngineRequest): unknown;
  clock?(req: EngineRequest): Clock;
  source?(call: SourceCall): Promise<SourceSql>;
  runAction?(call: ActionCall): Promise<ActionOutcome>;
  runBulkAction?(call: BulkActionCall): Promise<ActionOutcome>;
  runListAction?(call: ListActionCall): Promise<ActionOutcome>;
  actionPrefill?(call: PrefillCall): Promise<Rec>;
  previewAction?(call: PreviewCall): Promise<Preview>;
  lookup?(call: LookupCall): Promise<Rec>;
  readFile?(call: FileCall): Promise<FileContent>;
}
