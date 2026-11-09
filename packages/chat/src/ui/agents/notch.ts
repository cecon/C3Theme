/** Largura do entalhe que vale: número finito maior que zero, arredondado; o resto desliga o vão. */
export function notchWidth(notch: number | undefined): number {
  return typeof notch === 'number' && Number.isFinite(notch) && notch > 0 ? Math.round(notch) : 0;
}

/**
 * Faixa recolhida com vão no meio para o entalhe do Mac: três colunas (conteúdo, vão, conteúdo) e o botão recortado
 * no vão pelo `clip-path`, que também tira o vão do clique (o clique ali não acerta o botão). O vão não é elemento:
 * a ordem do leitor de tela não muda. Entalhe maior que a faixa: as colunas de conteúdo vão a zero e cortam.
 */
export function notchRowSx(notch: number) {
  const left = `calc(50% - ${notch / 2}px)`;
  const right = `calc(50% + ${notch / 2}px)`;
  return {
    display: 'grid',
    gridTemplateColumns: `minmax(0, 1fr) ${notch}px minmax(0, 1fr)`,
    gap: 0,
    clipPath: `polygon(0 0, ${left} 0, ${left} 100%, ${right} 100%, ${right} 0, 100% 0, 100% 100%, 0 100%)`
  };
}

/** Lado da faixa recolhida: sem entalhe some (`display: contents`) e a linha continua um flex só, como antes. */
export function notchSideSx(notch: number, side: 'start' | 'end') {
  if (!notch) return { display: 'contents' } as const;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    minWidth: 0,
    ...(side === 'start' ? { gridColumn: 1, pr: 1 } : { gridColumn: 3, pl: 1, justifyContent: 'flex-end' })
  } as const;
}
