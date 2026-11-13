// Tipos das configurações em modal (#119): o app declara abas/seções, linhas, controles e subpáginas no app.json.
// Ficam fora de types.ts para o arquivo principal caber no limite de 300 linhas.

import type { Text } from './types';

/** Opção de um controle `select` das configurações. */
export interface SettingsOptionDef {
  value: string;
  label: Text;
}

/**
 * Controle de uma linha de configuração. O valor inicial vem da spec e o sistema o atualiza pela porta
 * `settings` do <C3Shell>; `switch`, `select` e `slider` mudam na hora, `action` dispara a ação e `custom` é um
 * componente registrado que desenha o próprio controle.
 */
export type SettingsControlDef =
  | { type: 'switch'; value?: boolean; readOnly?: boolean }
  | { type: 'select'; value?: string; options: SettingsOptionDef[]; readOnly?: boolean }
  | { type: 'slider'; value?: number; min: number; max: number; step?: number; unit?: string; readOnly?: boolean }
  | { type: 'action'; label: Text; action?: string }
  | { type: 'page'; page: string; label: Text }
  | { type: 'text'; value?: string; readOnly?: boolean }
  | { type: 'custom'; component: string; config?: Record<string, unknown> };

/** Uma linha de configuração: título, explicação e controle. */
export interface SettingsRowDef {
  id: string;
  title: Text;
  description?: Text;
  /** palavras extras para a busca, além do título e da explicação */
  keywords?: Text[];
  control: SettingsControlDef;
  /** a linha some fora destas plataformas (além da seção) */
  platforms?: import('./formTypes').ClientPlatform[];
}

/** Uma subpágina de seção (detalhe de provedor, importação, papéis...): trilha e voltar. */
export interface SettingsPageDef {
  id: string;
  title: Text;
  description?: Text;
  rows: SettingsRowDef[];
  pages?: SettingsPageDef[];
}

/** Uma aba (configurações pessoais) ou seção (configurações do servidor). */
export interface SettingsSectionDef {
  id: string;
  title: Text;
  icon?: string;
  /** linha curta mostrada embaixo do título na navegação lateral */
  description?: Text;
  /** a seção some quando a plataforma não está na lista */
  platforms?: import('./formTypes').ClientPlatform[];
  /** chave do `pages` de GET /_meta/app: seção barrada quando o backend a marca como false */
  permission?: string;
  /**
   * Com `permission` negada: `true` (padrão) esconde a seção da navegação; `false` deixa a seção visível com o
   * painel explicativo de sem permissão no lugar do conteúdo.
   */
  hideWhenDenied?: boolean;
  rows?: SettingsRowDef[];
  pages?: SettingsPageDef[];
}

/** Declaração de um modal de configurações: título, busca, abas/seções, política e rodapé. */
export interface SettingsDef {
  title: Text;
  description?: Text;
  /** texto da caixa de busca das linhas; sem ele, a busca não aparece */
  search?: Text;
  sections: SettingsSectionDef[];
  /** seção aberta por padrão; a última aberta pode ser restaurada */
  initialSection?: string;
  /** restaura a seção aberta da última vez (chave estável por modal) */
  restoreSection?: boolean;
  /** clique no fundo fecha? Padrão: fecha */
  closeOnBackdrop?: boolean;
  /** fechamento com alterações pendentes pede confirmação? Padrão: pede */
  confirmPending?: boolean;
}

/** As configurações do app: as pessoais e, no rodapé delas, as do servidor. */
export interface AppSettingsDef extends SettingsDef {
  /** configurações do servidor, abertas pelo rodapé do modal pessoal */
  server?: SettingsDef;
}
