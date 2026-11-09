import type { CSSObject, Theme } from '@mui/material/styles';

/**
 * Barras de rolagem finas e discretas em todo o app, no lugar da barra nativa do sistema (no Windows, cinza
 * larga com setas). Polegar arredondado e fraco, que escurece ao passar o mouse na área que rola; sem trilho
 * e sem setas. Chromium, Edge/WebView2 e Safari usam `::-webkit-scrollbar` (as propriedades padrão desligariam
 * esse controle no Chromium e deixariam as setas); o Firefox usa `scrollbar-width`/`scrollbar-color`.
 */
export function scrollbarStyles(theme: Theme): CSSObject {
  const thumb = (alpha: number) => `rgb(${theme.vars.palette.text.primaryChannel} / ${alpha})`;
  return {
    '::-webkit-scrollbar': { width: 10, height: 10 },
    '::-webkit-scrollbar-track, ::-webkit-scrollbar-corner': { background: 'transparent' },
    '::-webkit-scrollbar-button': { display: 'none' },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: thumb(0.16),
      borderRadius: 10,
      border: '3px solid transparent',
      backgroundClip: 'content-box'
    },
    '*:hover::-webkit-scrollbar-thumb': { backgroundColor: thumb(0.3) },
    '::-webkit-scrollbar-thumb:active': { backgroundColor: thumb(0.45) },
    '@supports (-moz-appearance: none)': {
      '*': { scrollbarWidth: 'thin', scrollbarColor: `${thumb(0.16)} transparent` },
      '*:hover': { scrollbarColor: `${thumb(0.3)} transparent` }
    }
  };
}
