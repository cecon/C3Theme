/** Adapta controles à largura útil da casca, depois de reservar rails e dock. */
export const compactToolbar = (height: number) => ({
  minHeight: { xs: height },
  gap: 1.5,
  px: { xs: 2, sm: 3 },
  '@container c3-layout (max-width: 360px)': { px: 1, gap: 0.5, '& > a': { display: 'none' } }
});
export const headerActions = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'flex-end',
  minWidth: 0,
  overflowX: 'auto',
  '& > *': { flexShrink: 0 },
  '@container c3-layout (max-width: 360px)': { justifyContent: 'flex-start', gap: 0.5 }
};
