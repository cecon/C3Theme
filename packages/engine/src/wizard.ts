// Assistente em passos declarado no app.json (`pages[].wizard`, #34): os campos de cada passo, o que valida antes de
// avançar, o que grava e a guarda que leva toda rota ao assistente enquanto o registro diz que está pendente. Sem React.

import type { FieldDef, FormSection, Text, WireRecord } from './types';

export interface WizardStepDef {
  title: Text;
  description?: Text;
  /** Linhas de campos da entidade, como numa seção do formulário. */
  rows: NonNullable<FormSection['rows']>;
  /** Mostra "Pular": avança sem validar nem gravar. */
  optional?: boolean;
  /** Ação de registro que roda depois de gravar o passo (ex.: criar a máquina deste computador). */
  action?: string;
}

export interface WizardSummaryItem {
  label: Text;
  /** Campo boolean do registro: verdadeiro é feito; sem ele, o item só leva à tela. */
  done?: string;
  /** Rota da shell que resolve o item. */
  path: string;
}

export interface WizardDef {
  /** Entidade `singleton` (o registro da filial ativa) que os passos editam. */
  entity: string;
  /** Campo boolean do registro: verdadeiro prende o app no assistente (a guarda). O sistema calcula. */
  pending?: string;
  steps: WizardStepDef[];
  summary?: { title?: Text; description?: Text; items?: WizardSummaryItem[] };
}

/** Os campos de um passo, na ordem das linhas. */
export function stepFields(fields: FieldDef[], step: WizardStepDef): FieldDef[] {
  const names = (step.rows ?? []).flat().map((c) => (typeof c === 'string' ? c : c.field));
  return names.map((n) => fields.find((f) => f.name === n)).filter((f): f is FieldDef => Boolean(f));
}

const empty = (v: unknown) => v === null || v === undefined || v === '';

/** Obrigatórios vazios do passo (os escondidos e os só leitura não contam). */
export function stepErrors(
  fields: FieldDef[],
  record: WireRecord,
  visible: (f: FieldDef) => boolean,
  required: (f: FieldDef) => boolean
): Record<string, string> {
  return Object.fromEntries(
    fields.filter((f) => !f.readOnly && visible(f) && required(f) && empty(record[f.name])).map((f) => [f.name, 'Campo obrigatório.'])
  );
}

/** O que o passo grava: só os campos dele que podem ser escritos, do corpo já no formato trafegado. */
export function stepPatch(fields: FieldDef[], body: WireRecord): WireRecord {
  return Object.fromEntries(fields.filter((f) => !f.readOnly && f.name in body).map((f) => [f.name, body[f.name]]));
}

/** Página do assistente com guarda (`pending`): a primeira do app.json. */
export function guardPage(pages: { path: string; wizard?: WizardDef }[] = []) {
  const page = pages.find((p) => p.wizard?.pending);
  return page && { path: page.path, wizard: page.wizard! };
}

/** Para onde a guarda leva: a rota do assistente, se o registro está pendente e a rota atual não é ele. */
export function guardRedirect(path: string, wizardPath: string, record: WireRecord | undefined, pending: string) {
  if (!record || record[pending] !== true) return undefined;
  return path === wizardPath || path.startsWith(`${wizardPath}/`) ? undefined : wizardPath;
}
