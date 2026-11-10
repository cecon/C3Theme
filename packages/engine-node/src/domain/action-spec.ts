// Ações da entidade na spec (`actions`): o input vira uma entidade sem tabela, e `target: list` dispensa o registro.

import type { Condition } from './condition';
import { type Entity, fieldsOnly, resolveConditions } from './entity';
import { type Field, notForInput, parseFields } from './field';
import { type GridInput, splitGrids } from './grid-spec';
import { type Rec, isObject } from './types';

/** Comando sobre um registro. O motor valida e confere; quem executa é o sistema. */
export interface Action {
  name: string;
  /** Condição sobre o registro: fora dela a ação responde 409. */
  visibleWhen?: Condition;
  /** Roda também em lote, sobre várias linhas da lista. */
  bulk: boolean;
  /** `bulk: "together"`: o lote é um fato só; o sistema executa uma vez sobre todos os ids, tudo ou nada. */
  together: boolean;
  /** Ação da lista, sem registro (`target: list`): importar, aplicar modelo. */
  list: boolean;
  /** Campos pedidos antes de rodar, como uma entidade sem tabela (as condições citam esses campos). */
  input: Entity;
  /** Grades do input (`type: "grid"`): fora de `input.fields`, validadas linha a linha. */
  grids: GridInput[];
  /** `prefill: true`: a shell pede ao sistema os valores iniciais do input antes de abrir. */
  prefill: boolean;
  /** `returns: "file"`: a resposta pode ser o arquivo, baixado pela shell. */
  returnsFile: boolean;
  /** `preview: true`: antes de confirmar, o diálogo mostra a prévia do sistema. */
  preview: boolean;
  /** Ação que desfaz esta: o Desfazer da shell roda a inversa, com a versão conferida. */
  inverse?: string;
  /** `steps: true` (só ação de lista): roda em etapas, com `cursor` no corpo e `progress` na resposta. */
  steps: boolean;
}

/** Monta a ação (nome já conferido) e devolve o `visibleWhen` cru, resolvido depois com os campos da entidade. */
export function parseAction(name: string, a: Rec, fields: Field[], ident: (n: string) => boolean): [Action, unknown] {
  const label = `${name}.actions.${a.name as string}`;
  let bulk = false;
  let together = false;
  if (a.bulk === true) bulk = true;
  else if (a.bulk === 'together') [bulk, together] = [true, true];
  else if (a.bulk !== undefined && a.bulk !== null && a.bulk !== false) throw new Error(`${label}.bulk: use true ou "together"`);
  checkSummary(label, Array.isArray(a.summary) ? a.summary : [], bulk, fields);
  const inputRaw = isObject(a.input) && Array.isArray(a.input.fields) ? a.input.fields : [];
  const [plain, grids] = splitGrids(label, inputRaw, ident);
  const [inputFields, inputConditions] = parseFields(label, plain, ident);
  const dup = grids.find((g) => inputFields.some((f) => f.name === g.name));
  if (dup) throw new Error(`${label}: campo '${dup.name}' repetido`);
  // readOnly no input só trava a tela (o valor veio do prefill): para o motor o valor vem e é validado
  for (const f of inputFields) f.readOnly = false;
  const bad = inputFields.find(notForInput);
  if (bad) throw new Error(`${label}: campo '${bad.name}' do input não pode ser createOnly nem ter access`);
  const locked = inputConditions.find((c) => c[3] !== undefined);
  if (locked) throw new Error(`${label}: campo '${inputFields[locked[0]].name}' do input não pode ter readOnlyWhen`);
  const picked = grids.find((g) => g.fromSelection !== undefined);
  if (picked && (!together || picked.row.fields.find((c) => c.name === picked.fromSelection)?.reference !== name))
    throw new Error(`${label}.${picked.name}: fromSelection só em ação bulk "together", numa coluna reference para '${name}'`);
  const input = fieldsOnly(label, inputFields);
  resolveConditions(input, inputConditions);
  const list = a.target === 'list';
  const visibleWhen = a.visibleWhen ?? undefined;
  if (list && (bulk || visibleWhen !== undefined))
    throw new Error(`${label}: ação de lista (target 'list') não tem registro: sem bulk nem visibleWhen`);
  const returnsFile = a.returns === 'file';
  // um por um daria um arquivo por registro; em conjunto, o arquivo é um só
  if (returnsFile && bulk && !together)
    throw new Error(`${label}: ação que devolve arquivo (returns 'file') só roda em lote com bulk "together"`);
  const steps = a.steps === true;
  if (steps && (!list || returnsFile)) throw new Error(`${label}: steps só em ação de lista (target 'list') que não devolve arquivo`);
  const action: Action = {
    name: a.name as string,
    bulk,
    together,
    list,
    input,
    grids,
    prefill: a.prefill === true,
    returnsFile,
    preview: a.preview === true,
    inverse: typeof a.inverse === 'string' ? a.inverse : undefined,
    steps
  };
  return [action, visibleWhen];
}

/**
 * `inverse` aponta para outra ação de registro da mesma entidade, que roda sem perguntar nada (o Desfazer é um
 * clique). Entidade `undoable: false` não declara inversa: ali não existe Desfazer.
 */
export function checkInverses(name: string, undoable: boolean, actions: Action[]): void {
  for (const a of actions) {
    const inv = a.inverse;
    if (inv === undefined) continue;
    const label = `${name}.actions.${a.name}.inverse`;
    if (!undoable) throw new Error(`${label}: entidade com undoable false não tem Desfazer`);
    const target = actions.find((x) => x.name === inv);
    if (!target) throw new Error(`${label}: ação '${inv}' não existe`);
    if (target.name === a.name) throw new Error(`${label}: a ação não desfaz a si mesma`);
    if (a.list || target.list) throw new Error(`${label}: ação de lista (target 'list') não tem Desfazer`);
    if (a.together || target.together) throw new Error(`${label}: ação em conjunto (bulk 'together') não tem Desfazer`);
    if (target.returnsFile) throw new Error(`${label}: a inversa '${inv}' não pode devolver arquivo`);
    if (target.input.fields.length || target.grids.length)
      throw new Error(`${label}: a inversa '${inv}' roda num clique e não pode ter input`);
  }
}

/** `summary`: campos integer ou decimal da entidade, sem repetir, em ação que roda em lote. */
function checkSummary(label: string, summary: unknown[], bulk: boolean, fields: Field[]): void {
  if (summary.length && !bulk) throw new Error(`${label}.summary: só vale em ação com bulk`);
  const seen: string[] = [];
  for (const s of summary) {
    const name = isObject(s) && typeof s.field === 'string' ? s.field : '';
    const numeric = fields.some((f) => f.name === name && !f.writeOnly && (f.type === 'integer' || f.type === 'decimal'));
    if (!numeric) throw new Error(`${label}.summary: '${name}' precisa ser campo integer ou decimal`);
    if (seen.includes(name)) throw new Error(`${label}.summary: '${name}' repetido`);
    seen.push(name);
  }
}
