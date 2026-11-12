// Ferramenta que o agente quer rodar, com os argumentos que o humano pode conferir e editar antes (parte `c3.tool`,
// spec/v0/agent-ui.schema.json). É o "interrupt" do human-in-the-loop: aceitar, editar e aceitar, recusar dizendo o
// porquê, ou sempre permitir. O chat não roda nada: a resposta volta ao agente pela porta. Puro: sem React.

import type { UiAnswer, UiPart } from './ui';

/** Tipo do argumento na edição. `json`: objeto ou lista, editado como texto JSON. */
export type ArgType = 'string' | 'text' | 'number' | 'boolean' | 'enum' | 'json';

export interface ArgField {
  name: string;
  label?: string;
  type: ArgType;
  /** Só em `enum`. */
  options?: { value: string; label?: string }[];
  required?: boolean;
  /** Mostra, mas não deixa editar (o id do registro que a ferramenta vai mexer). */
  readOnly?: boolean;
}

/** Risco que o agente (ou o backend) atribui: `high` pede o segundo clique e não oferece "sempre permitir". */
export type ToolRisk = 'low' | 'medium' | 'high';

export interface ToolProposal {
  tool: { name: string; label?: string; description?: string };
  args: Record<string, unknown>;
  /** Como editar cada argumento. Sem isso, o tipo sai do valor (texto, número, sim/não, JSON). */
  fields?: ArgField[];
  risk?: ToolRisk;
  /** O que o humano pode fazer além de aprovar. Padrão: editar e responder sim; sempre permitir, não. */
  allow?: { edit?: boolean; respond?: boolean; always?: boolean };
}

/** O que voltou ao agente depois de aprovar. */
export interface ToolResult {
  args: Record<string, unknown>;
  /** Argumentos que o humano mudou. */
  edited: string[];
  always?: boolean;
  reason?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** O tipo de edição de um valor sem `fields`. Texto com quebra de linha ou longo vira caixa de várias linhas. */
export function inferType(value: unknown): ArgType {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return value.includes('\n') || value.length > 80 ? 'text' : 'string';
  return 'json';
}

/** Os campos da edição: os declarados, senão um por argumento, na ordem em que vieram. */
export const toolFields = (p: ToolProposal): ArgField[] =>
  p.fields ?? Object.entries(p.args).map(([name, v]) => ({ name, type: inferType(v) }));

/** O valor como aparece no campo de texto (número e JSON viram texto; o resto passa igual). */
export function toDraft(field: ArgField, value: unknown): string | boolean {
  if (field.type === 'boolean') return value === true;
  if (field.type === 'json') return value === undefined ? '' : JSON.stringify(value, null, 2);
  return value === undefined || value === null ? '' : String(value);
}

export type Parsed = { ok: true; value: unknown } | { ok: false; error: 'required' | 'number' | 'json' | 'option' };

/** Lê o que foi digitado de volta para o tipo do argumento. Vazio sem `required` vira `undefined` (sai do objeto). */
export function parseDraft(field: ArgField, raw: string | boolean): Parsed {
  if (field.type === 'boolean') return { ok: true, value: raw === true };
  const text = String(raw);
  if (!text.trim()) return field.required ? { ok: false, error: 'required' } : { ok: true, value: undefined };
  if (field.type === 'number') {
    const n = Number(text.replace(',', '.'));
    return Number.isFinite(n) ? { ok: true, value: n } : { ok: false, error: 'number' };
  }
  if (field.type === 'json') {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      return { ok: false, error: 'json' };
    }
  }
  if (field.type === 'enum' && !field.options?.some((o) => o.value === text)) return { ok: false, error: 'option' };
  return { ok: true, value: text };
}

/** Os argumentos finais a partir do rascunho, ou os erros por campo. Campo só leitura fica como veio. */
export function readDrafts(
  p: ToolProposal,
  drafts: Record<string, string | boolean>
): { args: Record<string, unknown>; errors: Record<string, Exclude<Parsed, { ok: true }>['error']> } {
  const args: Record<string, unknown> = { ...p.args };
  const errors: Record<string, Exclude<Parsed, { ok: true }>['error']> = {};
  for (const f of toolFields(p)) {
    if (f.readOnly || !Object.hasOwn(drafts, f.name)) continue;
    const r = parseDraft(f, drafts[f.name]);
    if (!r.ok) errors[f.name] = r.error;
    else if (r.value === undefined) delete args[f.name];
    else args[f.name] = r.value;
  }
  return { args, errors };
}

/** Os argumentos que mudaram (comparação pelo JSON, então `{a:1}` igual a `{a:1}`). */
export const changedArgs = (before: Record<string, unknown>, after: Record<string, unknown>): string[] =>
  [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));

/** O que o humano pode fazer, com os padrões e a regra do risco alto (nunca "sempre permitir"). */
export function toolAllows(p: ToolProposal) {
  const a = p.allow ?? {};
  return { edit: a.edit !== false, respond: a.respond !== false, always: a.always === true && p.risk !== 'high' };
}

/** A resposta de aprovar: os argumentos (editados ou não), o que mudou e o "sempre permitir". */
export function approveTool(p: ToolProposal, args: Record<string, unknown>, always = false): UiAnswer {
  const values: Record<string, unknown> = { args, edited: changedArgs(p.args, args) };
  if (always && toolAllows(p).always) values.always = true;
  return { action: 'accept', values };
}

/** A resposta de recusar, com o motivo para o agente tentar outro caminho. */
export function declineTool(reason?: string): UiAnswer {
  const text = reason?.trim();
  return text ? { action: 'decline', values: { reason: text } } : { action: 'decline' };
}

/** O resultado guardado na parte, se houver um válido. */
export function toolResult(part: UiPart): ToolResult | undefined {
  const r = part.result;
  if (!isObject(r)) return undefined;
  const edited = Array.isArray(r.edited) ? r.edited.filter((e): e is string => typeof e === 'string') : [];
  return {
    args: isObject(r.args) ? r.args : {},
    edited,
    always: r.always === true || undefined,
    reason: typeof r.reason === 'string' ? r.reason : undefined
  };
}

/** Confere o formato (o backend já conferiu; isto protege a tela de um servidor sem o motor). */
export function isToolProposal(v: unknown): v is ToolProposal {
  if (!isObject(v) || !isObject(v.tool) || typeof v.tool.name !== 'string' || !v.tool.name) return false;
  if (!isObject(v.args)) return false;
  return v.fields === undefined || (Array.isArray(v.fields) && v.fields.every((f) => isObject(f) && typeof f.name === 'string'));
}
