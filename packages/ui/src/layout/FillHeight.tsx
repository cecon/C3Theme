import { createContext, useContext, useEffect, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/** O AppLayout passa como ligar o modo "altura cheia"; fora dele, não há layout para mudar. */
export const FillContext = createContext<((on: boolean) => void) | null>(null);

export interface FillHeightProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Página que ocupa exatamente a altura que sobra na tela (chat, caixa de entrada, mapa, quadro): enquanto ela está
 * montada, o AppLayout para de rolar a janela e entrega o espaço entre o header e o rodapé. Quem rola é o conteúdo
 * de dentro (ex.: a lista de mensagens).
 */
export default function FillHeight({ children, sx }: FillHeightProps) {
  const setFill = useContext(FillContext);
  useEffect(() => {
    setFill?.(true);
    return () => setFill?.(false);
  }, [setFill]);
  return (
    <Box
      sx={[
        { flex: 1, minHeight: 0, height: setFill ? undefined : '100%', display: 'flex', flexDirection: 'column' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {children}
    </Box>
  );
}
