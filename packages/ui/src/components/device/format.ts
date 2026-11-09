// Regras puras dos componentes de aparelho: formatação do código de pareamento e tempo decorrido.

/** Código de pareamento sem espaços nem traços, em maiúsculas ("abcd-1234" vira "ABCD1234"). */
export const cleanPairingCode = (code: string) => code.replace(/[\s-]/g, '').toUpperCase();

/** Código em dois grupos de 4 para ler e digitar sem se perder: "ABCD-1234". Outro tamanho fica sem traço. */
export function formatPairingCode(code: string): string {
  const clean = cleanPairingCode(code);
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

/** Caractere por caractere para o leitor de tela soletrar ("A B C D, 1 2 3 4") em vez de ler como palavra. */
export function spellPairingCode(code: string): string {
  return formatPairingCode(code)
    .split('-')
    .map((group) => group.split('').join(' '))
    .join(', ');
}

export type ElapsedUnit = 'second' | 'minute' | 'hour' | 'day';

/**
 * Tempo decorrido de `from` até `now` na maior unidade inteira, negativo como pede o `formatRelativeTime`
 * (ex.: -5 minute vira "há 5 minutos"). Menos de um minuto (ou data no futuro, relógio adiantado) vira "agora".
 */
export function elapsed(from: number, now: number): { value: number; unit: ElapsedUnit } {
  const seconds = Math.max(0, Math.floor((now - from) / 1000));
  if (seconds < 60) return { value: 0, unit: 'second' };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { value: -minutes, unit: 'minute' };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: -hours, unit: 'hour' };
  return { value: -Math.floor(hours / 24), unit: 'day' };
}

/** Data do pedido em milissegundos; aceita ISO, número ou Date. */
export const toMillis = (at: string | number | Date) => (at instanceof Date ? at.getTime() : typeof at === 'number' ? at : Date.parse(at));
