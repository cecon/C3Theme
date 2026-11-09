import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SoftAvatar } from '@c3theme/ui';
import { iconByName, useEngine, useText } from '../../context';
import { displayValue, findOption } from '../../format';
import type { EntityDef, ExpandItem, FieldDef, ListExpand, WireRecord } from '../../types';

interface Item {
  def: FieldDef;
  label: string;
  icon?: string;
}

/**
 * Prévia do registro embaixo da linha (`views.list.expand`): dados com ícone em grade, números em destaque ao
 * lado e, na largura toda, texto longo com o rótulo como título e flags como etiquetas.
 */
export function RowPreview({ def, expand, row }: { def: EntityDef; expand: ListExpand; row: WireRecord }) {
  const text = useText();
  const intl = useIntl();
  const { icons } = useEngine();
  const resolve = (items: ExpandItem[] = []): Item[] =>
    items.flatMap((i) => {
      const item = typeof i === 'string' ? { field: i } : i;
      const f = def.fields.find((x) => x.name === item.field);
      return f ? [{ def: f, label: text(item.label ?? f.label, f.name), icon: item.icon }] : [];
    });
  const show = (f: FieldDef) => displayValue(f, row[f.name], intl.locale, (v) => text(findOption(f, v)?.label, v)) || '—';
  const [fields, stats, notes] = [resolve(expand.fields), resolve(expand.stats), resolve(expand.notes)];

  const info = (
    <Grid container spacing={2}>
      {fields.map(({ def: f, label, icon }) => {
        const Icon = iconByName(icon, icons);
        return (
          <Grid key={f.name} size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', minWidth: 0 }}>
              {Icon && (
                <SoftAvatar size="sm" tone="secondary">
                  <Icon size={16} />
                </SoftAvatar>
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" noWrap>
                  {show(f)}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        );
      })}
    </Grid>
  );
  const strip = stats.length > 0 && (
    <Stack
      direction="row"
      divider={<Divider orientation="vertical" flexItem />}
      sx={{ gap: 1, py: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}
    >
      {stats.map(({ def: f, label }) => (
        <Box key={f.name} sx={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
          <Typography variant="h5">{show(f)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      ))}
    </Stack>
  );

  return (
    <Stack sx={{ gap: 2.5 }}>
      <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, lg: strip ? 8 : 12 }}>{info}</Grid>
        {strip && <Grid size={{ xs: 12, lg: 4 }}>{strip}</Grid>}
      </Grid>
      {notes.map(({ def: f, label }) => {
        const value = row[f.name];
        if (f.type === 'flags') {
          const list = Array.isArray(value) ? (value as unknown[]) : [];
          if (!list.length) return null;
          return (
            <Stack key={f.name} direction="row" sx={{ gap: 1, flexWrap: 'wrap' }} aria-label={label}>
              {list.map((v) => (
                <Chip key={String(v)} label={text(findOption(f, v)?.label, String(v))} size="small" variant="outlined" />
              ))}
            </Stack>
          );
        }
        return (
          <Box key={f.name}>
            <Typography variant="subtitle2" gutterBottom>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {displayValue(f, value, intl.locale, (v) => v) || '—'}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
