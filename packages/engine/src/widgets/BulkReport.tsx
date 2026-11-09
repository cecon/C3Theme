// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

/** Resultado de uma ação em lote com falha: quantos deram certo e, um a um, os que não deram. */
export interface Report<A> {
  action: A;
  ok: number;
  skipped: number;
  failed: { id: string; title: string; message: string }[];
  /** Em conjunto, nada rodou: o aviso no lugar da contagem. */
  message?: string;
  /** Ids que ficam marcados ao fechar (em conjunto, os liberados); sem isso, os que falharam. */
  keep?: string[];
}

export default function BulkReport<A>({ report, title, onClose }: { report: Report<A> | null; title: string; onClose: () => void }) {
  return (
    <Dialog open={report !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {report && (
          <>
            <Alert severity={report.ok > 0 ? 'warning' : 'error'} sx={{ mb: 1 }}>
              {report.message ?? (
                <>
                  {`${report.ok} feito${report.ok === 1 ? '' : 's'}`}
                  {report.failed.length > 0 && `, ${report.failed.length} com erro`}
                  {report.skipped > 0 && `; ${report.skipped} fora da condição da ação, não enviados`}
                  {'.'}
                </>
              )}
            </Alert>
            <List dense>
              {report.failed.map((f) => (
                <ListItem key={f.id} disableGutters>
                  <ListItemText primary={f.title} secondary={f.message} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" onClick={onClose}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
