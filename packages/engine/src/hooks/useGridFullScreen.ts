import { useState } from 'react';

import type useActionInput from './useActionInput';

/** Acima disso a grade abre em tela cheia (contagem de inventário, ajuste de preço de muitos produtos). */
export const BIG_GRID = 15;

/**
 * Tamanho do diálogo da ação: com grade, 'md'; grade com mais de `BIG_GRID` linhas ao abrir, tela cheia. A escolha é
 * feita ao abrir (com o prefill já carregado) e não muda sozinha enquanto o usuário adiciona linhas; o botão do título
 * troca. `open` é a ação aberta (null fechado).
 */
export default function useGridFullScreen(form: ReturnType<typeof useActionInput>, open: unknown) {
  const big = form.grids.some((g) => form.rowsOf(g.name).length > BIG_GRID);
  const [state, setState] = useState({ for: open, full: big });
  // outra ação aberta: decide de novo (ajuste de estado durante o render, sem efeito)
  if (state.for !== open) setState({ for: open, full: big });
  const fullScreen = form.grids.length > 0 && (state.for === open ? state.full : big);
  return {
    fullScreen,
    maxWidth: form.grids.length ? ('md' as const) : ('sm' as const),
    onToggleFullScreen: form.grids.length ? () => setState({ for: open, full: !fullScreen }) : undefined
  };
}
