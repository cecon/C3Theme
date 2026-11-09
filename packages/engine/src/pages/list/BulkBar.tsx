import { useIntl } from 'react-intl';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Trash } from 'iconsax-reactjs';

import { useText } from '../../context';
import type { EntityDef, WireRecord } from '../../types';
import RecordActions from '../../widgets/RecordActions';
import { summaryText } from './selectionSum';

/** "2 selecionados" / "2 selecionadas", pelo gênero do nome da entidade. */
export const selectedText = (n: number, gender: 'm' | 'f' = 'm') =>
  `${n} ${gender === 'f' ? 'selecionada' : 'selecionado'}${n === 1 ? '' : 's'}`;

/**
 * Barra das linhas marcadas, numa faixa da cor primária: a contagem (e as somas), as ações em lote e, com
 * `onDelete`, o Excluir.
 */
export default function BulkBar({
  entity,
  def,
  rows,
  sums,
  onBulkDone,
  onDelete
}: {
  entity: string;
  def: EntityDef;
  rows: WireRecord[];
  sums: string[];
  onBulkDone: (failed: string[]) => void;
  onDelete?: () => void;
}) {
  const text = useText();
  const intl = useIntl();
  return (
    <Stack
      direction="row"
      sx={(theme) => ({
        px: 2.5,
        py: 1,
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
        bgcolor: `rgb(${theme.vars.palette.primary.mainChannel} / 0.08)`
      })}
    >
      <Typography variant="subtitle2" sx={{ flex: 1 }}>
        {selectedText(rows.length, def.label.gender)}
        {sums.length > 0 && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1.5 }} data-testid="selection-summary">
            {summaryText(def, rows, sums, intl.locale, text)}
          </Typography>
        )}
      </Typography>
      <RecordActions entity={entity} rows={rows} onBulkDone={onBulkDone} />
      {onDelete && (
        <Button size="small" color="error" startIcon={<Trash size={16} />} onClick={onDelete}>
          Excluir
        </Button>
      )}
    </Stack>
  );
}
