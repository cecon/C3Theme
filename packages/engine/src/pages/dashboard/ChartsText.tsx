import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { ChartsLocalizationProvider } from '@mui/x-charts/ChartsLocalizationProvider';
import { ptBRLocaleText, ptPTLocaleText, type ChartsLocaleText } from '@mui/x-charts/locales';

/** Textos do @mui/x-charts no idioma da tela; inglês é o padrão dele. */
export function chartsLocaleText(locale: string): Partial<ChartsLocaleText> | undefined {
  const lang = locale.toLowerCase();
  if (lang === 'pt-pt') return ptPTLocaleText;
  if (lang.startsWith('pt')) return ptBRLocaleText;
  return undefined;
}

/**
 * Gráfico do painel com os textos do idioma da shell (#7): "Sem dados para exibir" em vez de "No data to display",
 * ou o `empty` do widget, quando a spec diz.
 */
export default function ChartsText({ empty, children }: { empty?: string; children: ReactNode }) {
  const { locale } = useIntl();
  const localeText = { ...chartsLocaleText(locale), ...(empty ? { noData: empty } : {}) };
  return <ChartsLocalizationProvider localeText={localeText}>{children}</ChartsLocalizationProvider>;
}
