import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { ApiError } from '../../api';

/** Falha de um widget fica nele: o resto do painel continua. Sem acesso (filial, permissão) não é erro, é aviso discreto. */
export default function WidgetError({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.status === 403)
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Sem acesso a estes dados na filial atual.
      </Typography>
    );
  return (
    <Alert severity="error" variant="outlined">
      {error instanceof Error ? error.message : 'Não foi possível carregar.'}
    </Alert>
  );
}
