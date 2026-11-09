// material-ui
import { useColorScheme } from '@mui/material/styles';

/**
 * Paleta categórica dos gráficos, em ordem fixa (a cor segue a série, nunca a posição).
 * Aqui a cor é o próprio dado: as oito tonalidades foram conferidas para daltonismo e contraste,
 * com um passo próprio para o fundo escuro.
 */
const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
};

export function useIsDark() {
  const { mode, systemMode } = useColorScheme();
  return (mode === 'system' ? systemMode : mode) === 'dark';
}

/** Cores das séries no modo atual. */
export function useSeriesColors() {
  return CATEGORICAL[useIsDark() ? 'dark' : 'light'];
}

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1
});
export const num = new Intl.NumberFormat('pt-BR');
export const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
