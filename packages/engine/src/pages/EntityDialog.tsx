import { useCallback, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import EntityForm from './EntityForm';
import type { WireRecord } from '../types';

export interface EntityDialogProps {
  /** Aberto quando não é null; `id` ausente cria um registro novo; `edit` abre o existente já editando. */
  open: { id?: string; edit?: boolean } | null;
  entity: string;
  /** Valores que o formulário não mostra e sempre envia (o vínculo com o pai). */
  fixed?: Record<string, unknown>;
  /** Valores iniciais editáveis de um registro novo (ex.: o texto digitado na busca). */
  initial?: WireRecord;
  /** `saved` é o registro gravado, quando houve gravação. */
  onClose: (changed: boolean, saved?: WireRecord) => void;
}

/**
 * Formulário de qualquer entidade num diálogo, com estado próprio: é o bloco que o mestre-detalhe e o
 * cadastro rápido do campo de referência reaproveitam. Clicar fora ou apertar Esc com edição pela metade
 * pergunta antes de descartar.
 */
export default function EntityDialog({ open, entity, fixed, initial, onClose }: EntityDialogProps) {
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), []);
  const close = (changed: boolean, saved?: WireRecord) => {
    setDirty(false);
    setConfirmDiscard(false);
    onClose(changed, saved);
  };

  return (
    <>
      <Dialog open={open !== null} onClose={() => (dirty ? setConfirmDiscard(true) : close(false))} fullWidth maxWidth="md">
        <DialogContent sx={{ bgcolor: 'background.default' }}>
          {open && (
            <EntityForm
              key={open.id ?? 'new'}
              entity={entity}
              id={open.id}
              embedded={{ fixed: fixed ?? {}, initial, onClose: close, onDirtyChange, edit: open.edit }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)}>
        <DialogTitle>Descartar alterações?</DialogTitle>
        <DialogContent>
          <DialogContentText>O que foi digitado neste formulário ainda não foi salvo.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscard(false)}>Continuar editando</Button>
          <Button color="error" variant="contained" onClick={() => close(false)}>
            Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
