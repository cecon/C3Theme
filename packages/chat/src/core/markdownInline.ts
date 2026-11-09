// Markdown em linha (negrito, itálico, código, links) para árvore pura. Nada vira HTML: quem desenha monta
// elementos React a partir desta árvore, então não existe caminho para injetar <script> ou atributo.

export type MdInline =
  | { t: 'text'; v: string }
  | { t: 'br' }
  | { t: 'code'; v: string }
  | { t: 'strong' | 'em' | 'del'; c: MdInline[] }
  | { t: 'link'; href: string; c: MdInline[] };

/** Só esquemas inofensivos viram link; `javascript:`, `data:` e afins ficam como texto. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (/^(\/(?!\/)|#|\.\.?\/)/.test(href)) return href;
  return null;
}

const ESCAPABLE = /[\\`*_{}[\]()#+\-.!~|>]/;
const AUTOLINK = /^https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/i;

interface Delim {
  open: string;
  t: 'strong' | 'em' | 'del';
}
const DELIMS: Delim[] = [
  { open: '**', t: 'strong' },
  { open: '__', t: 'strong' },
  { open: '~~', t: 'del' },
  { open: '*', t: 'em' },
  { open: '_', t: 'em' }
];

const isWord = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

/** Acha o fechamento de um delimitador: precisa de conteúdo, sem espaço colado por dentro. */
function closing(src: string, from: number, d: Delim): number {
  let at = from;
  while ((at = src.indexOf(d.open, at)) >= 0) {
    const inner = src.slice(from, at);
    const ok = inner.length > 0 && !/^\s|\s$/.test(inner) && !(d.open === '_' && isWord(src[at + 1]));
    // `**` não fecha um `*`
    const glued = d.open === '*' && src[at + 1] === '*';
    if (ok && !glued) return at;
    at += glued ? 2 : d.open.length;
  }
  return -1;
}

export function parseInline(src: string): MdInline[] {
  const out: MdInline[] = [];
  let text = '';
  const flush = () => {
    if (text) out.push({ t: 'text', v: text });
    text = '';
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const rest = src.slice(i);

    if (ch === '\\' && ESCAPABLE.test(src[i + 1] ?? '')) {
      text += src[i + 1];
      i += 2;
      continue;
    }
    if (ch === '\n') {
      flush();
      out.push({ t: 'br' });
      i++;
      continue;
    }
    if (ch === '`') {
      const ticks = /^`+/.exec(rest)![0];
      const end = src.indexOf(ticks, i + ticks.length);
      if (end > 0) {
        flush();
        out.push({ t: 'code', v: src.slice(i + ticks.length, end).replace(/^ (.+) $/, '$1') });
        i = end + ticks.length;
        continue;
      }
    }
    if (ch === '[') {
      const m = /^\[([^\]\n]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)/.exec(rest);
      if (m) {
        const href = safeHref(m[2]);
        flush();
        if (href) out.push({ t: 'link', href, c: parseInline(m[1] || href) });
        else out.push(...parseInline(m[1]));
        i += m[0].length;
        continue;
      }
    }
    if ((ch === 'h' || ch === 'H') && !isWord(src[i - 1])) {
      const m = AUTOLINK.exec(rest);
      if (m) {
        flush();
        out.push({ t: 'link', href: m[0], c: [{ t: 'text', v: m[0] }] });
        i += m[0].length;
        continue;
      }
    }
    const d = DELIMS.find((x) => rest.startsWith(x.open));
    if (d && !(d.open[0] === '_' && isWord(src[i - 1]))) {
      const end = closing(src, i + d.open.length, d);
      if (end > 0) {
        flush();
        out.push({ t: d.t, c: parseInline(src.slice(i + d.open.length, end)) });
        i = end + d.open.length;
        continue;
      }
      // sem par: o delimitador inteiro é texto (evita `**` virar dois `*`)
      text += d.open;
      i += d.open.length;
      continue;
    }
    text += ch;
    i++;
  }
  flush();
  return out;
}

/** Texto puro da árvore: para copiar, para leitor de tela, para teste. */
export const inlineText = (nodes: MdInline[]): string =>
  nodes.map((n) => (n.t === 'text' || n.t === 'code' ? n.v : n.t === 'br' ? '\n' : inlineText(n.c))).join('');
