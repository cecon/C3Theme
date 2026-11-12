import type { Theme } from '@mui/material/styles';

// Estilos fixos repetidos nos cards de HITL. Constantes do módulo: o MUI recebe sempre o mesmo objeto.

/** Linha de botões que quebra. */
export const actionsSx = { gap: 1, flexWrap: 'wrap', alignItems: 'center' } as const;
/** Empurra o que vem depois para a direita. */
export const spacerSx = { flex: 1 } as const;
/** Cabeçalho do card: título e selo na mesma linha. */
export const headerSx = { alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 } as const;
export const secondarySx = { color: 'text.secondary' } as const;
export const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
/**
 * Selo de risco médio: o `warning.main` não dá 4,5:1 sobre o papel no claro (axe color-contrast);
 * no claro texto e borda vão no `warning.dark`, no escuro no `warning.main`, como o tema faz com o laranja em texto.
 */
export const warningChipSx = (theme: Theme) => ({
  color: theme.vars?.palette.warning.dark ?? theme.palette.warning.dark,
  borderColor: theme.vars?.palette.warning.dark ?? theme.palette.warning.dark,
  ...theme.applyStyles('dark', {
    color: theme.vars?.palette.warning.main ?? theme.palette.warning.main,
    borderColor: theme.vars?.palette.warning.main ?? theme.palette.warning.main
  })
});
