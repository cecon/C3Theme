import { useIntl } from 'react-intl';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { softColors, toneMain } from '@c3theme/ui';
import { useText } from '../../context';
import { findOption } from '../../format';
import type { EntityDef, FieldDef, Tone, WireRecord } from '../../types';
import { recordTitle } from '../../views';
import { Cell } from '../list/Cell';

interface MapBlockProps {
  def: EntityDef;
  row: WireRecord;
  fields: FieldDef[];
  tone: Tone;
  /** Texto da situação (option do enum `color`), lido também pelo leitor de tela. */
  status?: string;
  onOpen: (row: WireRecord) => void;
}

/** Um registro na planta: título, até 3 campos e a cor da situação. Clicar abre o registro com as ações. */
export default function MapBlock({ def, row, fields, tone, status, onOpen }: MapBlockProps) {
  const text = useText();
  const { locale } = useIntl();
  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);
  const title = recordTitle(def, row) || `#${row.id}`;

  return (
    <ButtonBase
      onClick={() => onOpen(row)}
      sx={(theme) => ({
        ...softColors(theme, tone),
        width: '100%',
        height: '100%',
        minHeight: 64,
        p: 1,
        borderRadius: 1.5,
        border: '2px solid',
        borderColor: toneMain(theme, tone),
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        textAlign: 'left',
        '&:focus-visible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 2 }
      })}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0, width: '100%' }}>
        <Typography variant="subtitle2" sx={{ color: 'inherit', overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {status && (
          <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 600 }}>
            {status}
          </Typography>
        )}
        {fields.map((f) => (
          // no tom do bloco: o cinza secundário sobre o fundo tingido não passa de 4,5:1 no escuro
          <Stack key={f.name} direction="row" spacing={0.5} sx={{ color: 'inherit', alignItems: 'baseline', typography: 'caption' }}>
            <span>{`${text(f.label, f.name)}:`}</span>
            <Cell field={f} row={row} locale={locale} optionLabel={optionLabel(f)} />
          </Stack>
        ))}
      </Stack>
    </ButtonBase>
  );
}
