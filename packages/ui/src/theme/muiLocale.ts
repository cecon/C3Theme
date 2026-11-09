import { esES, ptBR } from '@mui/material/locale';

/**
 * Textos dos componentes do próprio MUI (paginação "Linhas por página", "1–10 de 30", rótulos da Rating, do
 * Autocomplete...) no idioma do app. Inglês é o padrão do MUI e não precisa de nada.
 */
export function muiLocaleFor(locale: string | undefined): object | undefined {
  const lang = locale?.toLowerCase() ?? '';
  if (lang.startsWith('pt')) return ptBR;
  if (lang.startsWith('es')) return esES;
  return undefined;
}
