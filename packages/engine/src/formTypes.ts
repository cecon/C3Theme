// Formulário da entidade (spec/v0/entity.schema.json, views.form): seções, listas de filhos e o resumo calculado.

import type { Access, Condition, Denied, Text, WireRecord } from './types';

/** Campo do formulário: o nome, ou com o widget trocado (`component`) ou a aparência (`display: "swatches"`, enum em bolinhas). */
export type FormFieldDef = string | { field: string; component?: string; display?: 'swatches' };

/** Valor calculado para mostrar (fórmula de formulas.mjs), formatado como dinheiro quando tem `currency`. */
export interface ComputedValue {
  label: Text;
  value: string;
  currency?: string;
}

/** Linha do resumo: o `name` deixa as linhas de baixo citarem esta; `total` fecha o resumo em destaque. */
export interface SummaryLine extends ComputedValue {
  name?: string;
  /** Mostra com o sinal de menos (o desconto). */
  negative?: boolean;
  total?: boolean;
}

export interface RelatedDef {
  entity: string;
  field: string;
  columns?: string[];
  sort?: string;
  /** 'with_parent': os filhos são editados no formulário do pai e vão no corpo dele, na chave `entity`. */
  save?: 'separately' | 'with_parent';
  minItems?: number;
  maxItems?: number;
  /** 'checklist': lista de marcar sobre os registros da entidade de `option`; cada marcado é uma linha. */
  display?: 'table' | 'checklist';
  option?: string;
  /** Campo da entidade das opções que agrupa a lista. */
  groupBy?: string;
  /** Só em with_parent: contas por linha (total do item), sobre os campos da filha. */
  computed?: ComputedValue[];
  /** Só da shell: lista que o usuário só lê (capabilities.fields); não vai no corpo. */
  denied?: Denied;
  /** Só em separately: colunas que se digitam na linha, gravando pelo PATCH da filha. */
  editable?: string[];
  editMode?: 'instant' | 'batch';
  /** Só em separately: a busca e os presets da filha na seção. */
  search?: boolean;
  presets?: boolean;
}

export interface FormSection {
  title?: Text;
  description?: Text;
  /** Aba da seção; seções sem aba ficam acima das abas. */
  tab?: Text;
  /** Mostra a seção só quando vale; escondida, os campos dela vão null e a lista with_parent vai vazia. */
  visibleWhen?: Condition;
  access?: Access;
  /** Largura em colunas de 12 na tela média ou maior; seções seguidas com largura que somam até 12 dividem a linha. */
  width?: number;
  rows?: FormFieldDef[][];
  /** Contas mostradas abaixo dos campos da seção (subtotal, desconto, total). */
  summary?: SummaryLine[];
  component?: string;
  related?: RelatedDef;
  /** Ligar um aparelho por QR ou código, pelos campos do registro (#6). */
  pairing?: PairingDef;
}

/** Estado da tela de ligar aparelho (`DeviceLink` do @c3theme/ui). */
export type PairingState = 'connecting' | 'qr' | 'pairing-code' | 'connected' | 'logged-out' | 'error';

/** Seção de ligar aparelho: campos do registro e as ações de registro de cada botão. */
export interface PairingDef {
  status: string;
  /** Valor do campo `status` → estado da tela; valor fora daqui esconde a seção. */
  states: Record<string, PairingState>;
  qr?: string;
  code?: string;
  phone?: string;
  account?: string;
  error?: string;
  actions?: { qr?: string; code?: string; cancel?: string; retry?: string };
  steps?: Text[];
  codeSteps?: Text[];
}

export interface FormView {
  sections: FormSection[];
  /** Valores do registro novo só neste formulário; data aceita `{"$date": "today", "offset": 15}`. */
  initial?: WireRecord;
  /** 'footer': Cancelar e Salvar no fim do formulário, sem o título repetido em cima enquanto edita. */
  actions?: 'top' | 'footer';
  /** Texto do botão de gravar no registro novo e na alteração ("Criar fatura", "Salvar alterações"). */
  submitLabel?: { new?: Text; edit?: Text };
  /** Para onde ir depois de criar ("/conversa/{id}"); sem ele, o registro criado. */
  afterCreate?: string;
  /** Só singleton: cada campo grava ao mudar ou ao sair, sem Editar nem Salvar. */
  autosave?: boolean;
  /** Cabeçalho do registro: imagem (ou avatar) à esquerda do título e uma ou duas linhas embaixo. */
  header?: { image?: string | { component: string }; subtitle?: string; caption?: string[] };
  /** Folha para imprimir: as seções escolhidas (posições), a related inteira e as colunas em branco. */
  print?: { title?: Text; sections?: number[]; blank?: string[] };
}

/** Consultar e preencher: o valor de `field` vai ao backend, que devolve valores para `fills`. */
export interface LookupDef {
  name: string;
  field: string;
  fills: string[];
  /** 'change': consulta sozinha quando o valor fica válido; 'button' (padrão): botão ao lado do campo. */
  trigger?: 'change' | 'button';
  label?: Text;
  /** Outros campos do formulário que vão junto (ainda não salvos). */
  with?: string[];
  /** A resposta troca também o que o usuário já preencheu (Desfazer volta). */
  overwrite?: boolean;
}
