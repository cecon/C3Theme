// Estilos fixos repetidos nos cards de HITL. Constantes do módulo: o MUI recebe sempre o mesmo objeto.

/** Linha de botões que quebra. */
export const actionsSx = { gap: 1, flexWrap: 'wrap', alignItems: 'center' } as const;
/** Empurra o que vem depois para a direita. */
export const spacerSx = { flex: 1 } as const;
/** Cabeçalho do card: título e selo na mesma linha. */
export const headerSx = { alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 } as const;
export const secondarySx = { color: 'text.secondary' } as const;
export const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
