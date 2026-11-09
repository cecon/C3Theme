// Visibilidade na impressão, para usar em `sx` (o d-print-none/d-print-block do Bootstrap).

/** Some no papel: filtros, botões, menus. `sx={printHidden}`. */
export const printHidden = { '@media print': { display: 'none !important' } } as const;

/** Só aparece no papel: cabeçalho do relatório, período impresso. `sx={printOnly}`. */
export const printOnly = { display: 'none', '@media print': { display: 'block' } } as const;
