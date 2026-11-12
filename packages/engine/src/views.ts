// Quadro e calendário da entidade: rotas, colunas, condições e leitura em lotes. Sem React; as telas ficam em pages/board e pages/calendar.

import type { C3Client, ListParams } from './api';
import type { Capabilities, Condition, EntityDef, EntityViewKind, EnumValue, FieldDef, FormSection, Text, Tone, WireRecord } from './types';

/** Rota de cada tela da entidade, levando o preset ativo. */
export function viewPath(entity: string, view: EntityViewKind, preset?: string): string {
  const base = view === 'list' ? `/${entity}` : `/${entity}/${view}`;
  return preset ? `${base}?preset=${encodeURIComponent(preset)}` : base;
}

/** Telas que a entidade declara; a lista sempre existe. */
export function availableViews(def: EntityDef): EntityViewKind[] {
  return [
    'list',
    ...(def.views?.gallery ? ['gallery' as const] : []),
    ...(def.views?.board ? ['board' as const] : []),
    ...(def.views?.calendar ? ['calendar' as const] : []),
    ...(def.views?.report ? ['report' as const] : []),
    ...(def.views?.map ? ['map' as const] : [])
  ];
}

export interface BoardColumn {
  value: EnumValue;
  label: Text;
  color?: Tone;
}

/** Colunas do quadro na ordem de `columns` (ou de options). */
export function boardColumns(def: EntityDef): BoardColumn[] {
  const board = def.views?.board;
  const field = def.fields.find((f) => f.name === board?.groupBy);
  const options = field?.options ?? [];
  if (!board?.columns) return options;
  return board.columns.flatMap((v) => options.filter((o) => o.value === v));
}

/** Condição de uma coluna, somada ao filtro do preset. */
export function columnWhere(groupBy: string, value: EnumValue, base?: Condition): Condition {
  const own: Condition = { field: groupBy, op: 'eq', value };
  return base ? { and: [base, own] } : own;
}

/** Arrastar só grava quando o usuário altera a entidade e o campo do agrupamento não está travado. */
export function canMoveCards(def: EntityDef, capabilities: Capabilities): boolean {
  const field: FieldDef | undefined = def.fields.find((f) => f.name === def.views?.board?.groupBy);
  return Boolean(capabilities.update && field && !field.readOnly && !field.readOnlyWhen && !field.createOnly && !field.denied);
}

/** Campos do cartão (até 4), sem os que o usuário não pode ver. */
export function cardFields(def: EntityDef, names: string[] = []): FieldDef[] {
  return names.flatMap((n) => def.fields.filter((f) => f.name === n && f.denied !== 'hidden'));
}

/** `defaultSort` da lista no formato do parâmetro `sort` ("-campo,outro"). */
export function defaultSortParam(def: EntityDef): string | undefined {
  const sort = (def.views?.list?.defaultSort ?? []).map((s) => (s.direction === 'desc' ? '-' : '') + s.field).join(',');
  return sort || undefined;
}

/** Tamanhos de página do GET da lista (spec/v0/openapi.yaml). */
const PAGE_SIZES = [10, 25, 50, 100] as const;

/** Até `limit` registros, em páginas de até 100 (o máximo do contrato), e o total que existe. */
export async function listUpTo(
  client: C3Client,
  entity: string,
  params: Omit<ListParams, 'page' | 'pageSize'>,
  limit: number
): Promise<{ rows: WireRecord[]; total: number }> {
  const rows: WireRecord[] = [];
  // o contrato só aceita 10, 25, 50 ou 100 por página (422 fora disso): a menor que cobre o limite
  const pageSize = PAGE_SIZES.find((s) => s >= limit) ?? 100;
  for (let page = 1; ; page++) {
    const res = await client.list(entity, { ...params, page, pageSize });
    rows.push(...res.data);
    if (rows.length >= Math.min(limit, res.meta.total) || res.data.length < pageSize)
      return { rows: rows.slice(0, limit), total: res.meta.total };
  }
}

/**
 * Título do registro no cartão, no evento e no formulário: `titleField` ou o primeiro campo string. Campo
 * `reference` vem como `{ id, title }` e vale o `title` (antes saía "[object Object]", #161).
 */
export function recordTitle(def: EntityDef, row: WireRecord): string {
  // singleton (configuração) sem titleField fica com o label.singular: o primeiro texto seria um valor qualquer (#160)
  const name = def.titleField ?? (def.singleton ? undefined : def.fields.find((f) => f.type === 'string')?.name);
  const v = name ? row[name] : undefined;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return 'title' in v && v.title != null ? String(v.title) : '';
  return String(v);
}

/**
 * Campos de leitura do painel do fim do formulário: só os que nenhuma seção mostra. Antes repetia os que já estavam
 * nas seções, e uma entidade toda de leitura saía duas vezes (#161). Vazio: o painel não aparece.
 */
export function extraReadOnly(def: EntityDef, sections: FormSection[]): FieldDef[] {
  const placed = fieldsInSections(sections);
  return def.fields.filter((f) => f.readOnly && !f.denied && !placed.has(f.name));
}

/** Campos citados em alguma linha das seções do formulário. */
export function fieldsInSections(sections: FormSection[]): Set<string> {
  return new Set(sections.flatMap((s) => (s.rows ?? []).flat().map((cell) => (typeof cell === 'string' ? cell : cell.field))));
}

/**
 * Endereço depois de criar pela tela cheia: `views.form.afterCreate` com `{campo}` trocado pelo valor gravado
 * (reference: o id), ou `/{entity}/{id}`. Campo vazio ou ausente no modelo volta ao padrão (#164).
 */
export function createdPath(def: EntityDef, saved: WireRecord): string {
  const fallback = `/${def.name}/${saved.id}`;
  const template = def.views?.form?.afterCreate;
  if (!template) return fallback;
  let missing = false;
  const path = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = saved[name];
    const raw = v !== null && typeof v === 'object' && 'id' in v ? v.id : v;
    if (raw === null || raw === undefined || raw === '') missing = true;
    return encodeURIComponent(String(raw ?? ''));
  });
  return missing ? fallback : path;
}
