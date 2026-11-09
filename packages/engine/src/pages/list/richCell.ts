// Célula composta da lista (`secondary`, `join`, `avatar` na coluna): o texto de cada parte e o tom do avatar.

/** Iniciais das primeiras palavras ("Ana Souza" → "AS"; com `letters` 1, "A"). */
export const initialsOf = (name: string, letters: 1 | 2 = 2) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, letters)
    .map((w) => w[0].toUpperCase())
    .join('');

const TONES = ['primary', 'info', 'success', 'warning'] as const;

/** Tom estável por registro: o mesmo cliente tem sempre a mesma cor. */
export function avatarTone(id: string | undefined) {
  const n = Number(id);
  const key = Number.isInteger(n) ? n : [...(id ?? '')].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return TONES[Math.abs(key) % TONES.length];
}

/** Valor e emendados com " - ", sem os vazios ("Recife" + "PE" → "Recife - PE"). */
export const joined = (parts: string[]) => parts.filter((p) => p !== '').join(' - ');

/** `avatar` da coluna em forma única: campo da foto, letras e cor. */
export function avatarSpec(avatar: boolean | string | { photo?: string; letters?: 1 | 2; tone?: 'auto' | 'neutral' } | undefined) {
  if (!avatar) return undefined;
  if (avatar === true) return { letters: 2 as const, tone: 'auto' as const };
  if (typeof avatar === 'string') return { photo: avatar, letters: 2 as const, tone: 'auto' as const };
  return { photo: avatar.photo, letters: avatar.letters ?? 2, tone: avatar.tone ?? 'auto' };
}
