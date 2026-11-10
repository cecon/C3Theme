// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

import type { StepsState } from '../hooks/useStepsRun';

/**
 * Barra da ação da lista em etapas: "{done} de {total}", a mensagem parcial da última etapa e o Parar, que espera a
 * etapa em curso acabar. Não fecha por fora (Esc, clique no fundo) enquanto roda; com erro, mostra-o e fecha.
 */
export default function StepsDialog({
  title,
  state,
  onStop,
  onClose
}: {
  title: string;
  state: StepsState | null;
  onStop: () => void;
  onClose: () => void;
}) {
  const known = state?.total !== undefined && state.total > 0;
  const value = known ? Math.round((state!.done / state!.total!) * 100) : undefined;
  return (
    <Dialog open={state !== null} maxWidth="xs" fullWidth aria-labelledby="c3-steps-title" onClose={state?.error ? onClose : undefined}>
      <DialogTitle id="c3-steps-title">{title}</DialogTitle>
      <DialogContent>
        <LinearProgress
          variant={known ? 'determinate' : 'indeterminate'}
          value={value}
          aria-label="Andamento"
          sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
        />
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
          {known ? `${state!.done} de ${state!.total}` : 'Começando…'}
        </Typography>
        {state?.message && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {state.message}
          </Typography>
        )}
        {state?.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {state.error} O que as etapas anteriores gravaram fica.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {state?.error ? (
          <Button onClick={onClose}>Fechar</Button>
        ) : (
          <Button color="error" onClick={onStop} disabled={state?.stopping}>
            {state?.stopping ? 'Parando…' : 'Parar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
