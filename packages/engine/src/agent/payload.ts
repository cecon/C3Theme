// Partes de interface que o assistente pode pôr no chat, no catálogo do motor (spec/v0/agent-ui.schema.json).
// O agente propõe; quem grava é o motor, pelo mesmo endpoint e com a permissão do usuário. Puro: sem React.
// O backend do sistema confere o mesmo antes de emitir (c3_engine::Engine::check_agent_part); aqui é a segunda
// barreira, para uma parte malformada virar aviso e não tela quebrada.

import type { EntityDef, FieldDef, WireRecord } from '../types';
import { gridInputs, plainInputs } from '../actionTypes';

/** De onde veio cada valor que o assistente preencheu (campo → frase curta: "do pedido 1234"). */
export type Suggested = Record<string, string>;

/** `c3.form`: campos avulsos (motivo, período, quantidade); a resposta volta para o assistente. */
export interface FormPayload {
  title?: string;
  description?: string;
  fields: FieldDef[];
  rows?: string[][];
  /** Valores já preenchidos pelo assistente. */
  values?: WireRecord;
  suggested?: Suggested;
  submitLabel?: string;
}

/** `c3.record`: rascunho de um registro (novo, ou alteração quando há `id`); grava pelo CRUD da entidade. */
export interface RecordPayload {
  entity: string;
  id?: string;
  values: WireRecord;
  suggested?: Suggested;
  title?: string;
}

/** `c3.action`: confirmar uma ação declarada na entidade, com o input já preenchido. */
export interface ActionPayload {
  entity: string;
  id: string;
  action: string;
  input?: WireRecord;
  suggested?: Suggested;
}

type Entities = Record<string, { def: EntityDef } | undefined>;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Campo que o assistente nunca pede nem preenche: senha/PIN e arquivo (o modelo não deve ver nem inventar). */
export function forbiddenForAgent(f: FieldDef): boolean {
  return Boolean(f.writeOnly) || f.type === 'file';
}

function checkSuggested(suggested: unknown, allowed: (name: string) => boolean): string | null {
  if (suggested === undefined) return null;
  if (!isObject(suggested)) return 'suggested precisa ser um objeto';
  const bad = Object.keys(suggested).find((k) => !allowed(k) || typeof suggested[k] !== 'string');
  return bad ? `suggested: '${bad}' não é um campo preenchido` : null;
}

export function checkForm(p: unknown, entities: Entities): string | null {
  if (!isObject(p) || !Array.isArray(p.fields) || p.fields.length === 0) return 'c3.form precisa de fields';
  const fields = p.fields as FieldDef[];
  const names = new Set<string>();
  for (const f of fields) {
    if (!isObject(f) || typeof f.name !== 'string' || typeof f.type !== 'string') return 'campo sem name ou type';
    if (names.has(f.name)) return `campo '${f.name}' repetido`;
    names.add(f.name);
    if (forbiddenForAgent(f)) return `campo '${f.name}': o assistente não pede senha nem arquivo`;
    if (f.readOnly || f.createOnly || f.readOnlyWhen || f.access || f.filter) return `campo '${f.name}': só vale em entidade`;
    if (f.type === 'reference' && !entities[f.entity ?? '']) return `campo '${f.name}': entidade '${f.entity}' desconhecida`;
  }
  const values = p.values ?? {};
  if (!isObject(values)) return 'values precisa ser um objeto';
  const unknown = Object.keys(values).find((k) => !names.has(k));
  if (unknown) return `values: campo '${unknown}' desconhecido`;
  if (p.rows !== undefined && !(Array.isArray(p.rows) && p.rows.flat().every((n) => names.has(n as string))))
    return 'rows cita campo desconhecido';
  return checkSuggested(p.suggested, (k) => k in values);
}

/** Campos que um rascunho pode trazer: editáveis pelo usuário nesta operação. */
export function proposable(f: FieldDef | undefined, isNew: boolean): f is FieldDef {
  if (!f || forbiddenForAgent(f) || f.readOnly || f.denied) return false;
  return isNew || !f.createOnly;
}

export function checkRecord(p: unknown, entities: Entities): string | null {
  if (!isObject(p) || typeof p.entity !== 'string') return 'c3.record precisa de entity';
  const def = entities[p.entity]?.def;
  if (!def) return `entidade '${p.entity}' desconhecida`;
  if (p.id !== undefined && typeof p.id !== 'string') return 'id precisa ser texto';
  if (!isObject(p.values) || Object.keys(p.values).length === 0) return 'c3.record precisa de values';
  const isNew = p.id === undefined;
  const bad = Object.keys(p.values).find(
    (k) =>
      !proposable(
        def.fields.find((f) => f.name === k),
        isNew
      )
  );
  if (bad) return `campo '${bad}' não pode ser proposto`;
  return checkSuggested(p.suggested, (k) => k in (p.values as object));
}

export function checkAction(p: unknown, entities: Entities): string | null {
  if (!isObject(p) || typeof p.entity !== 'string' || typeof p.id !== 'string' || typeof p.action !== 'string') {
    return 'c3.action precisa de entity, id e action';
  }
  const def = entities[p.entity]?.def;
  const action = def?.actions?.find((a) => a.name === p.action);
  if (!def || !action) return `ação '${p.entity}.${p.action}' desconhecida`;
  if (action.target === 'list') return 'ação da lista não tem registro';
  const input = p.input ?? {};
  if (!isObject(input)) return 'input precisa ser um objeto';
  if (gridInputs(action).length) return 'ação com grade no input não é proposta pelo assistente';
  const fields = plainInputs(action);
  const bad = Object.keys(input).find((k) => {
    const f = fields.find((x) => x.name === k);
    return !f || forbiddenForAgent(f);
  });
  if (bad) return `input: campo '${bad}' não pode ser proposto`;
  return checkSuggested(p.suggested, (k) => k in input);
}
