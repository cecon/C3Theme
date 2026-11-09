import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';

/** Recuo das bordas da tabela, igual ao do cabeçalho do Panel (título à esquerda, ações à direita). */
export const TABLE_EDGE = 2.5;

const ROWS = ['& > thead > tr', '& > tbody > tr', '& > tfoot > tr'];
const cells = (cell: string) => ROWS.map((row) => `${row} > ${cell}`).join(', ');
const CHECKBOX = '.MuiTableCell-paddingCheckbox';
// célula que ocupa mais de uma coluna (vazio, detalhe, cabeçalho agrupado) não é a coluna; colspan="1" conta
const SINGLE = ':not([colspan]:not([colspan="1"]))';

export interface TableEdgesOptions {
  /** Recua a primeira e a última coluna como o cabeçalho do card. Padrão: true. */
  edges?: boolean;
  /** Última coluna do tamanho do conteúdo. Padrão: true; false quando ela é texto longo que deve quebrar. */
  hugLast?: boolean;
}

/**
 * Regra das bordas para a `sx` de uma `Table` do MUI:
 * - primeira e última coluna recuadas como o cabeçalho do card, para alinhar com título e botões
 *   (a caixa de marcar na primeira coluna recua menos, porque o próprio Checkbox já tem respiro);
 * - a última coluna (status, ações, número) fica do tamanho do conteúdo e a sobra de largura vai para as
 *   colunas de texto, em vez de virar um vão vazio no fim da linha. O conteúdo continua alinhado como
 *   o tipo pede (status à esquerda, número à direita); só some o vão.
 */
export function tableEdgesSx({ edges = true, hugLast = true }: TableEdgesOptions = {}): SystemStyleObject<Theme> {
  return {
    ...(edges && {
      [cells(`:first-child:not(${CHECKBOX})`)]: { pl: TABLE_EDGE },
      [cells(`:first-child${CHECKBOX}`)]: { pl: 1.5 },
      [cells(':last-child')]: { pr: TABLE_EDGE }
    }),
    ...(hugLast && {
      // a largura vem da linha de baixo do cabeçalho
      [`& > thead > tr:last-of-type > th:last-child${SINGLE}`]: { width: '1%', whiteSpace: 'nowrap' },
      [cells(`td:last-child${SINGLE}`)]: { whiteSpace: 'nowrap' }
    })
  };
}
