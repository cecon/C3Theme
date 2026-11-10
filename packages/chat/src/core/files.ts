// Anexos do composer sem React: o que o `accept` aceita e a lista sem repetidos. Vale para o seletor, colar e soltar.

/** O arquivo passa no `accept` do input ("image/*,.pdf"): extensão, tipo exato ou família. Vazio aceita tudo. */
export function acceptsFile(file: { name: string; type: string }, accept?: string): boolean {
  const rules = (accept ?? '')
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r));
}

/** Junta os novos à lista: o mesmo nome e tamanho entra uma vez só; o que o `accept` não aceita fica de fora. */
export function addFiles<T extends { name: string; size: number; type: string }>(list: T[], added: T[], accept?: string): T[] {
  const out = [...list];
  for (const f of added) if (acceptsFile(f, accept) && !out.some((l) => l.name === f.name && l.size === f.size)) out.push(f);
  return out;
}
