// Formatadores em pt-BR usados por todos os widgets.

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlRound = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('pt-BR');
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** R$ 1.234,56 (ou R$ 1.235 com `round`). */
export const formatBRL = (value: number, round = false) => (round ? brlRound : brl).format(value);
/** 12.345 */
export const formatNumber = (value: number) => integer.format(value);
/** 12,3 mil */
export const formatCompact = (value: number) => compact.format(value);
/** 12,3% */
export const formatPercent = (value: number) => `${percent.format(value)}%`;
