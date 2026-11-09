import { useCallback, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

import { useEngine } from '../context';
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
  const { entities } = useEngine();
  // formulário com botões no rodapé vira um diálogo comum: título, campos e botões do próprio diálogo
  const plain = entities[entity]?.def.views?.form?.actions === 'footer';
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), []);
  const close = (changed: boolean, saved?: WireRecord) => {
    setDirty(false);
    setConfirmDiscard(false);
    onClose(changed, saved);
  };

  const form = (o: { id?: string; edit?: boolean }) => (
    <EntityForm
      key={o.id ?? 'new'}
      entity={entity}
      id={o.id}
      embedded={{ fixed: fixed ?? {}, initial, onClose: close, onDirtyChange, edit: o.edit }}
    />
  );

  return (
    <>
      <Dialog
        open={open !== null}
        onClose={() => (dirty ? setConfirmDiscard(true) : close(false))}
        fullWidth
        maxWidth={plain ? 'sm' : 'md'}
        fullScreen={plain && fullScreen}
      >
        {open && plain && form(open)}
        {open && !plain && <DialogContent sx={{ bgcolor: 'background.default' }}>{form(open)}</DialogContent>}
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
