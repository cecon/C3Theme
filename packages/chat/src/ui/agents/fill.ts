/**
 * Faz o avatar que o app passou (SoftAvatar, img, SVG) preencher o círculo de `px`, com as iniciais na escala.
 * O `!important` vence o tamanho fixo que o avatar traz no próprio sx (ex.: SoftAvatar md = 40 px).
 */
export const fillAvatar = (px: number) => ({
  width: px,
  height: px,
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  '& > *': { width: '100% !important', height: '100% !important', fontSize: `${Math.round(px * 0.4)}px !important` }
});
