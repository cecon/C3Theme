/** Fora da tela, mas lido pelo leitor de tela (nome de link só com símbolo, região viva). */
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  margin: '-1px',
  p: 0,
  border: 0
} as const;
