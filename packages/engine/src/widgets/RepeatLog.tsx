import { useEffect, useRef, useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useText } from '../context';

/** Quantas leituras o histórico mostra. */
const KEEP = 5;

/** Histórico das leituras de uma ação `repeat` (bipar em sequência): a última em destaque, as anteriores abaixo. */
export function useRepeatLog() {
  const [items, setItems] = useState<{ n: number; message: string }[]>([]);
  const push = (message: string) => setItems((list) => [{ n: (list[0]?.n ?? 0) + 1, message }, ...list].slice(0, KEEP));
  return { items, push, clear: () => setItems([]) };
}

/**
 * O resultado da última leitura no próprio diálogo e as anteriores embaixo. A cada leitura nova devolve o foco ao
 * primeiro campo do diálogo, para o leitor bipar o próximo.
 */
export default function RepeatLog({ items }: { items: ReturnType<typeof useRepeatLog>['items'] }) {
  const text = useText();
  const ref = useRef<HTMLDivElement>(null);
  const last = items[0]?.n;
  useEffect(() => {
    if (!last) return;
    ref.current?.closest('[role="dialog"]')?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea')?.focus();
  }, [last]);
  if (!items.length) return <div ref={ref} />;
  const [now, ...before] = items;
  return (
    <Box ref={ref} sx={{ mt: 2 }}>
      <Alert severity="success" role="status">
        {now.message}
      </Alert>
      {before.length > 0 && (
        <Box
          component="ol"
          aria-label={text({ id: 'c3.action.repeatLog', defaultMessage: 'Leituras anteriores' })}
          sx={{ m: 0, mt: 1, pl: 2.5 }}
        >
          {before.map((i) => (
            <Typography key={i.n} component="li" variant="body2" color="text.secondary">
              {i.message}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
