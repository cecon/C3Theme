// Navegador interno: o que o agente está vendo e fazendo numa página (captura, endereço, o que vai clicar), para o
// humano acompanhar, aprovar o passo arriscado ou assumir o controle. O chat não abre a página: quem navega é o agente
// (navegador remoto do app); aqui chega só o estado. Parte `c3.browser` e o `BrowserView`. Puro: sem React.

import type { UiAnswer, UiPart } from './ui';

/** Ponto da página em %, de 0 a 100, a partir do canto de cima à esquerda (onde o agente vai clicar). */
export interface PagePoint {
  x: number;
  y: number;
}

export interface BrowserCheckpoint {
  url: string;
  title?: string;
  /** Captura da página (https ou data:image). Sem ela, o card mostra só o endereço. */
  frame?: string;
  /** O que o agente quer fazer agora ("Enviar o pedido de compra"). */
  intent: string;
  /** Onde ele vai clicar, para marcar na captura. */
  target?: PagePoint;
  risk?: 'low' | 'medium' | 'high';
  /** Oferece "Assumir controle". Padrão: sim. */
  allowTakeover?: boolean;
}

export type BrowserDecision = 'allow' | 'takeover';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Só http e https: `javascript:`, `file:` e companhia nunca viram link nem imagem. */
export function safeUrl(url: unknown): URL | undefined {
  if (typeof url !== 'string') return undefined;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Captura aceita: endereço http(s), caminho do próprio app (`/capturas/1.png`, nunca `//outro-site`) ou imagem
 * embutida (`data:image/png;base64,…`).
 */
export const safeFrame = (src: unknown): string | undefined =>
  typeof src === 'string' && (/^data:image\/(png|jpeg|webp|gif);base64,/.test(src) || /^\/(?![/\\])/.test(src) || safeUrl(src))
    ? src
    : undefined;

/** O endereço como a barra mostra: domínio em destaque e o resto apagado; `secure` acende o cadeado. */
export function addressParts(url: string): { host: string; rest: string; secure: boolean } | undefined {
  const u = safeUrl(url);
  if (!u) return undefined;
  const rest = `${u.pathname === '/' ? '' : u.pathname}${u.search}${u.hash}`;
  return { host: u.host, rest, secure: u.protocol === 'https:' };
}

/** O que foi digitado na barra vira endereço: sem esquema, ganha https. Endereço inválido devolve `undefined`. */
export function normalizeAddress(text: string): string | undefined {
  const t = text.trim();
  if (!t || /\s/.test(t)) return undefined;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
  return safeUrl(withScheme)?.href;
}

/** Ponto dentro da página (0 a 100), ou nada. */
export const clampPoint = (p: PagePoint | undefined): PagePoint | undefined =>
  p && Number.isFinite(p.x) && Number.isFinite(p.y)
    ? { x: Math.min(100, Math.max(0, p.x)), y: Math.min(100, Math.max(0, p.y)) }
    : undefined;

/** Permitir o passo ou assumir o controle (os dois aceitam a parte; o agente lê `decision`). */
export const decideBrowser = (decision: BrowserDecision): UiAnswer => ({ action: 'accept', values: { decision } });

export function browserDecision(part: UiPart): BrowserDecision | undefined {
  const d = isObject(part.result) ? part.result.decision : undefined;
  return d === 'allow' || d === 'takeover' ? d : undefined;
}

export function isBrowserCheckpoint(v: unknown): v is BrowserCheckpoint {
  return isObject(v) && !!safeUrl(v.url) && typeof v.intent === 'string' && v.intent.trim() !== '';
}
