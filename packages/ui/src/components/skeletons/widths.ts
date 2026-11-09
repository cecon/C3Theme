// Larguras dos placeholders: variadas para lembrar texto de verdade, e fixas por posição para não "dançar" a cada render.

/** Largura (em %) do placeholder de texto na posição `seed`: entre 45% e 89%. */
export function skeletonWidth(seed: number): string {
  return `${45 + ((Math.abs(Math.trunc(seed)) * 37) % 45)}%`;
}

/** Tipo de célula do placeholder de tabela; cada um tem o formato do conteúdo que vai chegar. */
export type SkeletonCell = 'text' | 'number' | 'chip' | 'check';

/** Normaliza `columns` (quantidade ou tipos) na lista de tipos. */
export function skeletonCells(columns: number | SkeletonCell[]): SkeletonCell[] {
  return typeof columns === 'number' ? Array.from({ length: Math.max(0, columns) }, () => 'text') : columns;
}
