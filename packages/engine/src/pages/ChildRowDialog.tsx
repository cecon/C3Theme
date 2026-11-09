import { useMemo, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

import { evaluate } from '../conditions.mjs';
import useLookups from '../hooks/useLookups';
import FieldInput from '../widgets/FieldInput';
import WithLookup from '../widgets/WithLookup';
import type { EntityDef, FieldDef, FieldType, WireRecord } from '../types';

export interface ChildRowDialogProps {
  title: string;
  /** Entidade da filha: as consultas (`lookups`) dela funcionam no diálogo. */
  def?: EntityDef;
  fields: FieldDef[];
  row: WireRecord;
  errors: Record<string, string>;
  onApply: (row: WireRecord) => void;
  onCancel: () => void;
}

/**
 * Uma linha filha num diálogo. "Aplicar" só muda o rascunho do formulário do pai: quem grava é o Salvar dele.
 * No celular, abre em tela cheia.
 */
export default function ChildRowDialog({ title, def, fields, row, errors, onApply, onCancel }: ChildRowDialogProps) {
  const [draft, setDraft] = useState<WireRecord>(row);
  const [local, setLocal] = useState<Record<string, string>>({});
  const lookup = useLookups(def, draft, true, (v) => setDraft((d) => ({ ...d, ...v })));
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const types = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, f.type])) as Record<string, FieldType>, [fields]);
  const visible = (f: FieldDef) => !f.visibleWhen || evaluate(f.visibleWhen, draft, types);
  const required = (f: FieldDef) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, draft, types));

  const apply = () => {
    const missing = fields.filter((f) => visible(f) && required(f) && [null, undefined, ''].includes(draft[f.name] as never));
    if (missing.length) {
      setLocal(Object.fromEntries(missing.map((f) => [f.name, 'Campo obrigatório.'])));
      return;
    }
    onApply(draft);
  };

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2.5} sx={{ pt: 1 }}>
          {fields.filter(visible).map((f) => (
            <Grid key={f.name} size={12}>
              <WithLookup button={lookup(f.name)}>
                <FieldInput
                  field={f}
                  value={draft[f.name]}
                  record={draft}
                  onChange={(v) => {
                    setDraft((d) => ({ ...d, [f.name]: v }));
                    setLocal(({ [f.name]: _, ...rest }) => rest);
                  }}
                  error={local[f.name] ?? errors[f.name]}
                  required={required(f)}
                />
              </WithLookup>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={apply}>
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
