import type { FieldDef } from '../../types';

// tipos de conteúdo curto: na última coluna ficam do tamanho do conteúdo, sem vão no fim da linha
const COMPACT_TYPES = new Set<FieldDef['type']>(['enum', 'boolean', 'date', 'datetime', 'integer', 'decimal', 'flags']);

/**
 * A última coluna da lista abraça o conteúdo quando é curta (status, data, número) e a spec não fixou
 * largura nem trocou a célula por componente próprio. Texto livre continua ocupando a sobra e quebrando linha.
 */
export function hugsLastColumn(columns: { width?: number; component?: string; def: Pick<FieldDef, 'type'> }[]): boolean {
  const last = columns[columns.length - 1];
  return Boolean(last && last.width === undefined && !last.component && COMPACT_TYPES.has(last.def.type));
}
