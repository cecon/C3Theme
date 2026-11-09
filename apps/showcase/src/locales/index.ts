import type { LocaleMessages, LocaleOption } from '@c3theme/ui';

/** Idiomas do seletor de aparência. Para um idioma novo, crie o JSON e acrescente aqui. */
export const LOCALES: LocaleOption[] = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en', label: 'English' }
];

export const loadMessages = (locale: string): Promise<LocaleMessages> =>
  (locale === 'en' ? import('./en.json') : import('./pt-BR.json')).then((m) => m.default);
