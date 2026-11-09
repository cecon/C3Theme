import type { Tone } from '@c3theme/ui';
import type { ChartTone } from './useChartColors';

/** Converte o tom dos gráficos (nomes da paleta do MUI) para o tom dos componentes da C3. */
export const toTone = (tone: ChartTone): Tone => (tone === 'error' ? 'danger' : tone);
