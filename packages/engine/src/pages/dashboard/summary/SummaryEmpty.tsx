import Typography from '@mui/material/Typography';

import { useText } from '../../../context';
import type { Text } from '../../../types';

/** Resumo sem itens no caminho do widget. */
export default function SummaryEmpty({ text: t }: { text?: Text }) {
  const text = useText();
  return (
    <Typography color="text.secondary" sx={{ py: 1 }}>
      {text(t, 'Nada por aqui.')}
    </Typography>
  );
}
