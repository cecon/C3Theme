// Views de quadro, calendário, relatório e planta da entidade (spec/v0/entity.schema.json, views.board, .calendar, .report e .map).

import type { EnumValue, Text } from './types';

/** Quadro (kanban): colunas pelos valores de um enum; arrastar grava o campo. */
export interface BoardView {
  groupBy: string;
  columns?: EnumValue[];
  /** No cartão: enum vira chip na linha do prazo; os outros, uma linha cada. */
  fields?: string[];
  pageSize?: number;
  /** Campo mostrado acima do título, na cor primária (código da história, número do pedido). */
  code?: string;
  /** Campo date do prazo: chip com ícone; vermelho se venceu, amarelo em até 2 dias, verde na coluna `done`. */
  due?: string;
  /** Reference do responsável: avatar com as iniciais no pé do cartão. */
  assignee?: string;
  /** Contadores (integer) no pé do cartão, com ícone do catálogo; zero não aparece. */
  counters?: { field: string; icon: string; label?: Text }[];
  /** Valor da coluna de concluídos: título riscado, prazo verde e um visto no cabeçalho. */
  done?: EnumValue;
  /** false: sem o "Adicionar cartão" no pé da coluna (que cria só com o título). */
  quickAdd?: boolean;
}

/** Calendário do mês pelo campo de data `start` (até `end`, se houver). */
export interface CalendarView {
  start: string;
  end?: string;
  /** Campo boolean de dia inteiro (só com start datetime): sem hora no evento. */
  allDay?: string;
  color?: string;
  fields?: string[];
}

/**
 * Relatório (`views.report`): as linhas do filtro, agrupadas por um ou dois campos, com subtotal por grupo e total
 * geral; ou em árvore pelo `parent`, só exibindo (os totais por nível vêm do sistema, como na DRE).
 */
export interface ReportView {
  title?: Text;
  columns: string[];
  groupBy?: string[];
  subtotals?: string[];
  sort?: string;
  tree?: { parent: string };
}

/**
 * Planta (`views.map`): cada registro é um bloco colorido pelo enum `color`, posicionado por coordenadas
 * (`position`, células a partir de 1) ou dentro de grupos aninhados (`groupBy`, um ou dois campos).
 */
export interface MapView {
  title?: Text;
  color?: string;
  fields?: string[];
  groupBy?: string[];
  position?: { x: string; y: string; w?: string; h?: string };
  size?: 'small' | 'medium' | 'large';
}

/** Coluna da lista: o campo, ou o campo com largura, widget próprio e o que se junta a ele na célula. */
export type ColumnDef =
  | string
  | {
      field: string;
      width?: number;
      component?: string;
      /** Título no lugar do rótulo do campo. */
      label?: Text;
      /** O valor vira link que abre o registro. */
      link?: boolean;
      /** Segunda linha, menor e apagada (e-mail embaixo do nome). */
      secondary?: string;
      /** Emendados com " - " (cidade e UF). */
      join?: string[];
      /** true: iniciais do valor; nome de campo: endereço da foto; objeto: foto, quantas letras e cor. */
      avatar?: boolean | string | ColumnAvatar;
      /** Peso do valor; padrão negrito com `secondary`. */
      weight?: 'normal' | 'bold';
      /** Edita na própria linha: `instant` grava ao mudar; `batch` junta as linhas e grava no "Salvar alterações". */
      edit?: 'instant' | 'batch';
    };

/** Ícones da coluna "Ações" da lista, ou uma ação de registro sem input nem confirm ("Instalar"), num botão. */
export type RowAction = 'view' | 'edit' | 'delete' | { action: string };

/** Imagem do registro: campo com a URL, ou um componente registrado na shell que desenha o rosto do registro. */
export type RecordImageDef = string | { component: string };

/** Lista em cartões (`views.gallery`): imagem ou avatar, título, uma ou duas linhas e um chip. O cartão abre o registro. */
export interface GalleryView {
  image?: RecordImageDef;
  /** Padrão: o titleField. */
  title?: string;
  subtitle?: string;
  /** Linha pequena embaixo: os valores dos campos, separados por " · ". */
  caption?: string[];
  /** Campo enum (com a cor da opção) ou de texto, num chip. */
  chip?: string;
  /** 'large': cartões maiores, para destaques. */
  size?: 'small' | 'large';
  /** Clicar na imagem abre o visualizador em tela cheia (anterior, próxima, zoom); o cartão continua abrindo o registro. */
  viewer?: boolean;
}

/** Item da prévia da linha: o campo, ou o campo com rótulo e ícone próprios. */
export type ExpandItem = string | { field: string; label?: Text; icon?: string };

/** Prévia aberta pela seta da linha: dados com ícone, números em destaque e texto longo. */
export interface ListExpand {
  fields?: ExpandItem[];
  stats?: ExpandItem[];
  notes?: ExpandItem[];
}

/** Como a lista se apresenta além das colunas: ações e prévia na linha, abas, período, busca e exportação. */
export interface ListLook {
  rowActions?: RowAction[];
  expand?: ListExpand;
  /** Presets como abas com contagem; `all` é o rótulo da primeira aba, sem preset. */
  presetTabs?: { all?: Text };
  /** Filtro de período num campo de data: "{label} de" e "até". */
  dateRange?: { field: string; label?: Text };
  /** Placeholder da busca no lugar de "Em 42 clientes". */
  searchHint?: Text;
  /** false tira o "Exportar CSV". */
  export?: boolean;
  /** 'quiet': ver e editar (lápis) em cinza. */
  rowActionsStyle?: 'color' | 'quiet';
  /** Registro e novo abrem num diálogo sobre a lista, em vez da página. */
  open?: 'page' | 'dialog';
}

/** Avatar da coluna em objeto: campo da foto, uma ou duas iniciais e cor por registro ou cinza. */
export interface ColumnAvatar {
  photo?: string;
  letters?: 1 | 2;
  tone?: 'auto' | 'neutral';
}
