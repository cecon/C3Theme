// Ações da entidade (spec/README.md#ações): o comando, o input e a grade no input.

import type { Condition } from './conditions.mjs';
import type { FieldDef, Text, Tone } from './types';

/** Grade no input (`type: grid`): várias linhas digitadas de uma vez; trafega como lista de objetos. */
export interface GridFieldDef {
  name: string;
  type: 'grid';
  label: Text;
  help?: Text;
  /** Pelo menos uma linha (o mesmo que minItems 1). */
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  /** Colunas. `readOnly` só trava a célula: o valor vai ao sistema. */
  fields: FieldDef[];
}

export type InputFieldDef = FieldDef | GridFieldDef;

export const isGrid = (f: InputFieldDef): f is GridFieldDef => f.type === 'grid';

/** Comando sobre um registro (spec/README.md#ações). */
export interface ActionDef {
  name: string;
  label: Text;
  description?: Text;
  icon?: string;
  tone?: Tone;
  /** Condição sobre o registro; fora dela a ação não aparece (e o backend responde 409). */
  visibleWhen?: Condition;
  /**
   * Roda também sobre as linhas marcadas na lista: `true`, um por um (cada um passa ou falha sozinho);
   * `'together'`, um fato só sobre todas (uma baixa, uma fatura), tudo ou nada.
   */
  bulk?: boolean | 'together';
  /** Somas das linhas marcadas (campos integer ou decimal), na barra da seleção e no diálogo. */
  summary?: { field: string }[];
  /** 'list': comando da lista, sem registro (importar, aplicar modelo); botão no topo da lista. */
  target?: 'record' | 'list';
  confirm?: Text;
  confirmLabel?: Text;
  input?: { fields: InputFieldDef[]; rows?: string[][] };
  /** Valores iniciais do input vêm do sistema (`.../_prefill`) antes de abrir o diálogo. */
  prefill?: boolean;
  /** Antes de confirmar, o diálogo mostra a prévia do sistema (`.../_preview`): texto, sugestões e tabela. */
  preview?: boolean;
  /** Fica aberta para a próxima leitura (bipar em sequência): limpa o input e mostra o resultado no diálogo. */
  repeat?: boolean;
  /** 'file': a resposta pode ser um arquivo, que a shell baixa (SPED, CSV). Em lote, só com `bulk: 'together'`. */
  returns?: 'file';
  successMessage?: Text;
  /** Ação que desfaz esta (sem input): depois de rodar, a shell oferece Desfazer. */
  inverse?: string;
}

/** Campos simples do input (sem as grades). */
export const plainInputs = (action: ActionDef | null | undefined): FieldDef[] =>
  (action?.input?.fields ?? []).filter((f): f is FieldDef => !isGrid(f));

/** Grades do input. */
export const gridInputs = (action: ActionDef | null | undefined): GridFieldDef[] => (action?.input?.fields ?? []).filter(isGrid);

/** Resposta de `.../_preview`: nada foi gravado. */
export interface ActionPreview {
  message?: string | null;
  /** Valores para os campos do input ainda vazios. */
  fill?: Record<string, unknown>;
  table?: { columns: { name: string; label: string }[]; rows: Record<string, unknown>[] } | null;
}
