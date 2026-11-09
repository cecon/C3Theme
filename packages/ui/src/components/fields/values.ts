// Regras de valor dos campos, sem React: o que o campo aceita, como mostra e como grava.

/** Separador decimal do idioma ("," em pt-BR, "." em en). */
export const decimalSep = (locale?: string) => (1.1).toLocaleString(locale).charAt(1);

/**
 * Texto digitado num campo decimal para o valor gravado: string com ponto ("1234.5"), null se vazio, undefined se
 * a digitação não é um número válido (o campo ignora a tecla). Aceita vírgula ou ponto e corta além da escala.
 */
export function parseDecimal(raw: string, scale?: number, allowNegative = true): string | null | undefined {
  const s = raw.replace(/\s/g, '');
  if (s === '') return null;
  const match = /^(-?)(\d*)(?:[.,](\d*))?$/.exec(s);
  if (!match || (match[1] && !allowNegative)) return undefined;
  const [, sign, int, frac] = match;
  if (frac === undefined) return sign + int;
  if (scale === 0) return undefined;
  return `${sign}${int}.${scale === undefined ? frac : frac.slice(0, scale)}`;
}

/** Valor gravado para exibição com milhar e a escala completa ("1234.5", 2, pt-BR → "1.234,50"). */
export function formatDecimal(v: string, scale: number, locale?: string) {
  const [int, frac = ''] = v.replace('-', '').split('.');
  const grouped = Number(int || '0').toLocaleString(locale);
  const digits = frac.padEnd(scale, '0').slice(0, scale);
  return `${v.startsWith('-') ? '-' : ''}${grouped}${scale ? decimalSep(locale) + digits : ''}`;
}

/**
 * Valor gravado como dinheiro no idioma ("9568.2", 2, "BRL", pt-BR → "R$ 9.568,20"). O número sai de `formatDecimal`
 * (sem passar por float); do Intl vêm só a posição do símbolo, do sinal e o espaço entre eles.
 */
export function formatMoney(v: string, scale: number, currency: string, locale?: string) {
  const negative = v.trim().startsWith('-');
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(negative ? -1 : 1);
  const number = formatDecimal(v.replace('-', ''), scale, locale);
  const numeric = new Set(['integer', 'group', 'decimal', 'fraction']);
  return parts
    .filter((p, i) => !numeric.has(p.type) || !numeric.has(parts[i - 1]?.type ?? ''))
    .map((p) => (numeric.has(p.type) ? number : p.value))
    .join('');
}

/** Símbolo da moeda no idioma ("R$" para BRL em pt-BR). */
export function currencySymbol(currency: string, locale?: string) {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? currency;
}

/**
 * Valor escolhido num select para o valor da opção, com o tipo original; vazio é null. O `<select>` nativo devolve
 * texto e o Select do MUI devolve o próprio valor do MenuItem (número numa opção numérica): compara os dois como texto.
 */
export function optionValue<V extends string | number>(options: { value: V }[], raw: unknown): V | null {
  if (raw === '' || raw == null) return null;
  return options.find((o) => String(o.value) === String(raw))?.value ?? null;
}

/** Soma dos bits de todas as opções de um `flags`. */
export const allFlags = (options: { value: number }[]) => options.reduce((acc, o) => acc | o.value, 0);

/**
 * Arquivo como trafega. Novo: o conteúdo inteiro em base64 em `data`, sem o prefixo `data:`. Gravado (leitura de
 * um campo da entidade): só os metadados, com `size` em bytes e sem `data`.
 */
export interface FileValue {
  name: string;
  contentType?: string | null;
  data?: string;
  size?: number;
}

/** Tamanho em bytes de um base64 padrão. */
export const decodedSize = (data: string) => Math.floor((data.length * 3) / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);

/** Tamanho para a tela: bytes abaixo de 1 KB (um anexo pequeno não aparece como "0 KB"), senão KB. */
export const formatKb = (bytes: number, locale?: string) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KB`;

/** Por que o arquivo escolhido não serve, antes de ler o conteúdo; null quando serve. */
export function fileProblem(file: { name: string; size: number }, accept: string[], maxSize: number): 'type' | 'large' | 'empty' | null {
  if (accept.length && !accept.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase()))) return 'type';
  if (file.size > maxSize) return 'large';
  if (file.size === 0) return 'empty';
  return null;
}
