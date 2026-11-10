import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SoftAvatar } from '@c3theme/ui';
import { displayValue } from '../../format';
import type { FieldDef, Tone, WireRecord } from '../../types';
import { Cell } from './Cell';
import { avatarSpec, avatarTone, initialsOf, joined } from './richCell';
import type { ColumnAvatar } from '../../viewTypes';

/** O que a coluna junta ao campo dela: segunda linha, emendados e avatar. */
export interface ColumnExtras {
  secondary?: FieldDef;
  join?: FieldDef[];
  avatar?: boolean | string | ColumnAvatar;
  link?: boolean;
  weight?: 'normal' | 'bold';
  /** Tom da célula pelo valor de outro campo (`tone`): o campo já ligado e o mapa valor → tom. */
  tone?: { field: FieldDef; map?: Record<string, Tone> };
}

export const hasExtras = (x: ColumnExtras) => Boolean(x.secondary || x.join?.length || x.avatar || x.link);

/**
 * Célula de uma coluna da lista. Sem extras é o `Cell` do tipo. Com extras, o texto do campo (emendado com os
 * `join`), a segunda linha apagada e o avatar de iniciais ou foto antes, como na lista de clientes.
 */
export function ColumnCell({
  field,
  extras,
  to,
  row,
  component,
  locale,
  optionLabel
}: {
  field: FieldDef;
  extras: ColumnExtras;
  /** Endereço do registro, para `link`. */
  to: string;
  row: WireRecord;
  component?: any;
  locale: string;
  optionLabel: (f: FieldDef) => (v: string) => string;
}) {
  if (component || !hasExtras(extras)) {
    return <Cell field={field} row={row} component={component} locale={locale} optionLabel={optionLabel(field)} />;
  }
  const show = (f: FieldDef) => displayValue(f, row[f.name], locale, optionLabel(f));
  const main = joined([show(field), ...(extras.join ?? []).map(show)]);
  const second = extras.secondary && show(extras.secondary);
  const avatar = avatarSpec(extras.avatar);
  const photo = avatar?.photo ? (row[avatar.photo] as string | null | undefined) : undefined;
  const bold = (extras.weight ?? (second ? 'bold' : 'normal')) === 'bold';

  const texts = (
    <Box sx={{ minWidth: 0 }}>
      {extras.link ? (
        <Link component={RouterLink} to={to} underline="hover" variant="subtitle2" noWrap onClick={(e) => e.stopPropagation()}>
          {main}
        </Link>
      ) : (
        <Typography variant={bold ? 'subtitle2' : 'body2'} noWrap>
          {main}
        </Typography>
      )}
      {second && (
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {second}
        </Typography>
      )}
    </Box>
  );
  if (!avatar) return texts;
  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', minWidth: 220 }}>
      <SoftAvatar size="sm" src={photo || undefined} alt={main} tone={avatar.tone === 'neutral' ? 'neutral' : avatarTone(row.id)}>
        {initialsOf(main, avatar.letters)}
      </SoftAvatar>
      {texts}
    </Stack>
  );
}
