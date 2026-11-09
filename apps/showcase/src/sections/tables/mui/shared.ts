export type Sentido = 'asc' | 'desc';

/** Ordena uma cópia da lista pela chave, comparando texto em pt-BR e números pelo valor. */
export function ordenar<T>(lista: T[], chave: keyof T, sentido: Sentido): T[] {
  const fator = sentido === 'asc' ? 1 : -1;
  return [...lista].sort((a, b) => {
    const va = a[chave];
    const vb = b[chave];
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * fator;
    return String(va).localeCompare(String(vb), 'pt-BR') * fator;
  });
}
