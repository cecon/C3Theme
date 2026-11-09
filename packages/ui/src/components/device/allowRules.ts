// Regras puras da lista de liberados e bloqueados: o que o campo aceita e como compara com o que já está na lista.

export type AllowKind = 'contact' | 'group';
export type AllowAccess = 'allowed' | 'blocked';

export interface AllowEntry {
  id: string;
  kind: AllowKind;
  /** Telefone só com dígitos (com DDI) ou ID do grupo (ex.: "120363041234567890@g.us"). */
  value: string;
  /** Nome para mostrar; sem ele aparece o telefone ou o ID. */
  label?: string;
  access: AllowAccess;
}

export type AllowParse = { ok: true; kind: AllowKind; value: string } | { ok: false; error: 'empty' | 'invalid' };

const GROUP = /^[0-9]{6,}(-[0-9]+)?@g\.us$/;

/**
 * Lê o que a pessoa digitou: ID de grupo (termina em "@g.us") ou telefone. O telefone aceita "+", espaços, traços e
 * parênteses e guarda só os dígitos; precisa de 10 a 15 dígitos (DDD + número no mínimo, E.164 no máximo).
 */
export function parseAllowValue(input: string): AllowParse {
  const text = input.trim();
  if (!text) return { ok: false, error: 'empty' };
  if (text.toLowerCase().endsWith('@g.us')) {
    const group = text.toLowerCase();
    return GROUP.test(group) ? { ok: true, kind: 'group', value: group } : { ok: false, error: 'invalid' };
  }
  if (!/^\+?[0-9\s().-]+$/.test(text)) return { ok: false, error: 'invalid' };
  const digits = text.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 ? { ok: true, kind: 'contact', value: digits } : { ok: false, error: 'invalid' };
}

/** A entrada que já tem esse contato ou grupo, para avisar em vez de duplicar. */
export const findEntry = (entries: AllowEntry[], kind: AllowKind, value: string) =>
  entries.find((e) => e.kind === kind && e.value === value);

/** Telefone legível a partir dos dígitos: "+55 11 98765-4321" para o Brasil, "+<dígitos>" para o resto. */
export function formatPhone(digits: string): string {
  const br = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return br ? `+55 ${br[1]} ${br[2]}-${br[3]}` : `+${digits}`;
}
