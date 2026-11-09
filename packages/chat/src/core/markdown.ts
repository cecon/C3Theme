// Markdown de bloco (o que um assistente de IA costuma responder) para árvore pura: parágrafo, título, lista,
// citação, código, tabela e linha. Feito para texto que ainda está chegando: bloco sem fechamento (``` aberto,
// `**` sem par) não quebra, só aparece como está até o resto chegar.

import { parseInline, type MdInline } from './markdownInline';

export type { MdInline } from './markdownInline';
export { inlineText, parseInline, safeHref } from './markdownInline';

export type MdAlign = 'left' | 'center' | 'right' | null;

export type MdBlock =
  | { t: 'p'; c: MdInline[] }
  | { t: 'h'; level: 1 | 2 | 3 | 4 | 5 | 6; c: MdInline[] }
  | { t: 'code'; lang: string; v: string }
  | { t: 'list'; ordered: boolean; start: number; items: MdBlock[][] }
  | { t: 'quote'; c: MdBlock[] }
  | { t: 'hr' }
  | { t: 'table'; align: MdAlign[]; head: MdInline[][]; rows: MdInline[][][] };

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>\s?/;
const ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const blank = (line: string) => line.trim() === '';

function cells(line: string): string[] {
  const body = line
    .trim()
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '');
  return body.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

const alignOf = (sep: string): MdAlign =>
  sep.startsWith(':') && sep.endsWith(':') ? 'center' : sep.endsWith(':') ? 'right' : sep.startsWith(':') ? 'left' : null;

/** Começa um bloco que interrompe o parágrafo em curso. */
const startsBlock = (line: string, next?: string) =>
  FENCE.test(line) ||
  HEADING.test(line) ||
  HR.test(line) ||
  QUOTE.test(line) ||
  ITEM.test(line) ||
  (line.includes('|') && next !== undefined && TABLE_SEP.test(next) && next.includes('-'));

export function parseMarkdown(src: string): MdBlock[] {
  return parseLines(src.replace(/\r\n?/g, '\n').split('\n'));
}

function parseLines(lines: string[]): MdBlock[] {
  const out: MdBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (blank(line)) {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const close = new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}\\s*$`);
      const body: string[] = [];
      i++;
      while (i < lines.length && !close.test(lines[i])) body.push(lines[i++]);
      i++; // fechamento (ou fim do texto, se ainda está chegando)
      out.push({ t: 'code', lang: fence[2], v: body.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      out.push({ t: 'h', level: heading[1].length as 1, c: parseInline(heading[2]) });
      i++;
      continue;
    }

    if (HR.test(line)) {
      out.push({ t: 'hr' });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && !blank(lines[i]) && (QUOTE.test(lines[i]) || !startsBlock(lines[i]))) {
        body.push(lines[i++].replace(QUOTE, ''));
      }
      out.push({ t: 'quote', c: parseLines(body) });
      continue;
    }

    if (ITEM.test(line)) {
      i = parseList(lines, i, out);
      continue;
    }

    const sep = lines[i + 1];
    if (line.includes('|') && sep !== undefined && TABLE_SEP.test(sep) && sep.includes('-')) {
      const head = cells(line);
      const align = cells(sep).map(alignOf);
      const rows: MdInline[][][] = [];
      i += 2;
      while (i < lines.length && !blank(lines[i]) && lines[i].includes('|')) {
        const row = cells(lines[i++]);
        rows.push(head.map((_, c) => parseInline(row[c] ?? '')));
      }
      out.push({ t: 'table', align: head.map((_, c) => align[c] ?? null), head: head.map((h) => parseInline(h)), rows });
      continue;
    }

    const para: string[] = [line.trim()];
    i++;
    while (i < lines.length && !blank(lines[i]) && !startsBlock(lines[i], lines[i + 1])) para.push(lines[i++].trim());
    out.push({ t: 'p', c: parseInline(para.join('\n')) });
  }
  return out;
}

/** Lista a partir da linha `i`: itens do mesmo tipo, com o que estiver recuado (sublista, parágrafo) dentro. */
function parseList(lines: string[], i: number, out: MdBlock[]): number {
  const first = ITEM.exec(lines[i])!;
  const ordered = /\d/.test(first[2]);
  const items: string[][] = [];
  while (i < lines.length) {
    const m = ITEM.exec(lines[i]);
    if (!m || /\d/.test(m[2]) !== ordered) break;
    const indent = m[1].length + m[2].length + 1;
    const body = [m[3]];
    i++;
    while (i < lines.length) {
      const line = lines[i];
      const lead = line.length - line.trimStart().length;
      if (blank(line)) {
        // linha em branco só continua o item se o que vem depois estiver recuado
        const next = lines[i + 1];
        if (next !== undefined && !blank(next) && next.length - next.trimStart().length >= Math.min(indent, 2)) {
          body.push('');
          i++;
          continue;
        }
        break;
      }
      if (lead >= Math.min(indent, 2)) body.push(line.slice(Math.min(lead, indent)));
      else if (!startsBlock(line))
        body.push(line.trim()); // continuação preguiçosa do texto do item
      else break;
      i++;
    }
    items.push(body);
    if (blank(lines[i] ?? '') && ITEM.test(lines[i + 1] ?? '')) i++;
  }
  out.push({ t: 'list', ordered, start: ordered ? parseInt(first[2], 10) : 1, items: items.map(parseLines) });
  return i;
}
