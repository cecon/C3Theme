// Contagem regressiva: o que falta até um instante, em dias, horas, minutos e segundos. Puro (sem relógio).

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export interface CountdownPart {
  unit: CountdownUnit;
  value: number;
}

/** O que falta de `now` até `until` (ms); já passou vira tudo zero. */
export function countdownParts(until: number, now: number): CountdownPart[] {
  const left = Math.max(0, Math.floor((until - now) / 1000));
  return [
    { unit: 'days', value: Math.floor(left / 86400) },
    { unit: 'hours', value: Math.floor((left % 86400) / 3600) },
    { unit: 'minutes', value: Math.floor((left % 3600) / 60) },
    { unit: 'seconds', value: left % 60 }
  ];
}

/** Dois dígitos (dias passam de 99 sem cortar). */
export const twoDigits = (n: number) => String(n).padStart(2, '0');
