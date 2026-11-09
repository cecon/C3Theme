import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useEngine, useText } from '../../context';
import { findOption } from '../../format';
import type { FieldDef, WireRecord } from '../../types';
import { recordTitle } from '../../views';
import RecordActions from '../../widgets/RecordActions';
import { Cell } from '../list/Cell';

/**
 * O registro clicado na planta: os campos do bloco e as ações que valem para ele agora, sem sair da planta. Mostra a
 * linha da última leitura da planta, que a ação (e o `live`) releem; o servidor confere o `visibleWhen` de novo ao
 * rodar, então uma linha velha nunca roda a ação errada.
 */
export default function MapRecordDialog({
  entity,
  row,
  fields,
  onClose
}: {
  entity: string;
  row: WireRecord | null;
  fields: FieldDef[];
  onClose: () => void;
}) {
  const { entities } = useEngine();
  const { def } = entities[entity];
  const text = useText();
  const { locale } = useIntl();
  const navigate = useNavigate();
  const record = row;
  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);

  return (
    <Dialog open={row !== null} onClose={onClose} fullWidth maxWidth="xs">
      {record && (
        <>
          <DialogTitle>{recordTitle(def, record) || `#${record.id}`}</DialogTitle>
          <DialogContent>
            <Stack spacing={1}>
              {fields.map((f) => (
                <Stack key={f.name} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                    {text(f.label, f.name)}
                  </Typography>
                  <Cell field={f} row={record} locale={locale} optionLabel={optionLabel(f)} />
                </Stack>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
              <RecordActions entity={entity} id={record.id!} record={record} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={() => navigate(`/${entity}/${record.id}`)}>
              Abrir registro
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
