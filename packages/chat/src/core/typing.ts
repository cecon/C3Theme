// Quem está digitando: cada aviso vale por um tempo e some sozinho se o "parei" se perder no caminho.

import type { Author } from './types';

/** Quanto tempo um "digitando" vale sem ser renovado. */
export const TYPING_TTL_MS = 6000;

export interface Typist {
  author: Author;
  until: number;
}

export function updateTypists(list: Typist[], author: Author, typing: boolean, now: number, ttl = TYPING_TTL_MS): Typist[] {
  const rest = list.filter((t) => t.author.id !== author.id);
  return typing ? [...rest, { author, until: now + ttl }] : rest;
}

export const activeTypists = (list: Typist[], now: number) => list.filter((t) => t.until > now);
