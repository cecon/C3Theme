// Idioma do FullCalendar pelo locale do app: português carrega o pacote pt-br; o resto vai pelo nome, e o que o
// FullCalendar não conhece cai no padrão dele (inglês).

import type { LocaleInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

export function fcLocale(locale: string | undefined): LocaleInput | string | undefined {
  if (!locale) return undefined;
  return locale.toLowerCase().startsWith('pt') ? ptBrLocale : locale;
}
