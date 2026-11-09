// Data digitada no idioma do app, sem React e sem depender da língua do navegador: o `<input type="date">` nativo
// mostra mm/dd/yyyy num Chrome em inglês mesmo com o app em pt-BR. Aqui a ordem dos pedaços vem do `locale`.

export type DatePart = 'day' | 'month' | 'year';

/** Ordem dos pedaços e separador do idioma: pt-BR → dia/mês/ano com "/", en-US → mês/dia/ano, de → "." */
export interface DatePattern {
  order: DatePart[];
  sep: string;
}

const pad = (n: number, size = 2) => String(n).padStart(size, '0');

export function datePattern(locale?: string): DatePattern {
  const parts = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(
    new Date(2001, 10, 22)
  );
  const order = parts.map((p) => p.type).filter((t): t is DatePart => t === 'day' || t === 'month' || t === 'year');
  const sep =
    parts
      .find((p) => p.type === 'literal')
      ?.value.trim()
      .charAt(0) || '/';
  return order.length === 3 ? { order, sep } : { order: ['day', 'month', 'year'], sep: '/' };
}

const SIZE: Record<DatePart, number> = { day: 2, month: 2, year: 4 };

/** Máscara de digitação ("dd/mm/aaaa"); `letters` são as iniciais de dia, mês e ano no idioma ("dma", "dmy"). */
export function datePlaceholder(p: DatePattern, letters = 'dmy') {
  const letter: Record<DatePart, string> = { day: letters[0], month: letters[1], year: letters[2] };
  return p.order.map((part) => letter[part].repeat(SIZE[part])).join(p.sep);
}

/** Valor gravado (AAAA-MM-DD) para a tela ("2026-10-31" → "31/10/2026" em pt-BR). Fora do formato, vazio. */
export function formatIsoDate(iso: string | null | undefined, p: DatePattern) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const value: Record<DatePart, string> = { year: m[1], month: m[2], day: m[3] };
  return p.order.map((part) => value[part]).join(p.sep);
}

/**
 * Texto em digitação para o texto mascarado: só dígitos, com o separador posto sozinho ("3110" → "31/10").
 * Aceita colar com qualquer separador ("31-10-2026", "31.10.2026"). `previous` é o texto antes da tecla.
 */
export function maskDate(raw: string, p: DatePattern, previous = '') {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  let rest = digits;
  p.order.forEach((part, i) => {
    if (!rest) return;
    const chunk = rest.slice(0, SIZE[part]);
    rest = rest.slice(SIZE[part]);
    out += chunk;
    if (chunk.length === SIZE[part] && i < p.order.length - 1) out += p.sep;
  });
  // apagar o separador apaga junto o dígito antes dele (senão o backspace não sai do lugar)
  return raw.length < previous.length && out.endsWith(p.sep) ? out.slice(0, -1) : out;
}

/** Dia que existe no calendário (31/02 não). */
export function isRealDate(year: number, month: number, day: number) {
  const d = new Date(year, month - 1, day);
  return year >= 1000 && d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Texto da tela para o valor gravado: ISO quando é uma data completa e real, null quando vazio, `'invalid'`
 * quando está incompleto ou não existe (32/01, 29/02 fora de ano bissexto).
 */
export function parseDateText(text: string, p: DatePattern): string | null | 'invalid' {
  const digits = text.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length !== 8) return 'invalid';
  const value = { day: 0, month: 0, year: 0 } as Record<DatePart, number>;
  let at = 0;
  for (const part of p.order) {
    value[part] = Number(digits.slice(at, at + SIZE[part]));
    at += SIZE[part];
  }
  if (!isRealDate(value.year, value.month, value.day)) return 'invalid';
  return `${pad(value.year, 4)}-${pad(value.month)}-${pad(value.day)}`;
}

/** Data local para ISO (AAAA-MM-DD), sem passar por UTC. */
export const toIsoDate = (d: Date) => `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** ISO para Date ao meio-dia local (o meio-dia não muda de dia com horário de verão). */
export const fromIsoDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);

/** ISO dentro dos limites (os dois inclusivos e opcionais); compara texto, que no ISO dá a mesma ordem. */
export const inRange = (iso: string, min?: string, max?: string) => (!min || iso >= min) && (!max || iso <= max);

/**
 * Semanas do mês para a grade do calendário, começando no domingo: cada célula é o ISO do dia, ou null antes do dia
 * 1 e depois do último. `month` vai de 0 a 11.
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${pad(year, 4)}-${pad(month + 1)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** Soma dias a uma data ISO (setas do teclado no calendário). */
export function addDays(iso: string, n: number) {
  const d = fromIsoDate(iso);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

/** Hora em digitação para "HH:MM" (24 h), com os dois-pontos postos sozinhos. `previous` é o texto antes da tecla. */
export function maskTime(raw: string, previous = '') {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  const out = digits.length >= 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
  return raw.length < previous.length && out.endsWith(':') ? out.slice(0, -1) : out;
}

/** "HH:MM" válida (00:00 a 23:59), null quando vazia, `'invalid'` quando incompleta ou fora da faixa. */
export function parseTimeText(text: string): string | null | 'invalid' {
  const digits = text.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length !== 4) return 'invalid';
  const h = Number(digits.slice(0, 2));
  const m = Number(digits.slice(2));
  return h < 24 && m < 60 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : 'invalid';
}
