import { useIntl } from 'react-intl';

// material-ui
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { notify, SoftAvatar, StatusChip } from '@c3theme/ui';
import { errorMessage } from '../../auth/pages/shared';
import { useEngine, useText } from '../../context';
import { bothWhere, formatMeasure, measureField, measureNumber, RankingWidget as Ranking, widgetWhere } from '../../dashboard';
import { initialsOf } from '../list/richCell';
import { useAggregate } from './useAggregate';
import WidgetError from './WidgetError';

/**
 * Os maiores grupos do recorte (o cliente que mais deve): avatar, nome, `caption` com a contagem, o valor e o chip
 * de `flag` (a parte vencida) ou de `otherwise`. Com `action`, o botão roda a ação de registro da entidade do grupo
 * (o reference do `groupBy`) no grupo da linha.
 */
export default function RankingWidget({ widget }: { widget: Ranking }) {
  const { client, entities } = useEngine();
  const text = useText();
  const { locale } = useIntl();
  const { def } = entities[widget.entity];
  const where = widgetWhere(widget, def);
  const measure = widget.measure ?? 'count';
  const { data, error } = useAggregate(widget.entity, { measure: ['count', measure], groupBy: widget.groupBy, where });
  const flagged = useAggregate(
    widget.entity,
    widget.flag ? { measure, groupBy: widget.groupBy, where: bothWhere(where, widget.flag.where) } : null
  );

  if (error) return <WidgetError error={error} />;
  if (!data)
    return (
      <Stack sx={{ p: 2.5 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={56} />
        ))}
      </Stack>
    );
  const sum = measureField(def, measure);
  const target = def.fields.find((f) => f.name === widget.groupBy)?.entity;
  const action = target ? entities[target]?.def.actions?.find((a) => a.name === widget.action) : undefined;
  const run = (id: string) =>
    client
      .action(target!, id, action!.name)
      .then((out) => notify(out.message ?? (action!.successMessage ? text(action!.successMessage) : 'Feito.')))
      .catch((e: unknown) => notify(errorMessage(e), 'error'));
  const top = data
    .filter((g) => g.key !== null)
    .map((g) => ({ ...g, amount: measureNumber(g.values?.[1] ?? g.value), count: measureNumber(g.values?.[0] ?? 0) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, widget.limit ?? 5);
  const caption = (n: number) =>
    text(widget.caption)
      .replace('{count}', String(n))
      .replace('{label}', text(n === 1 ? def.label.singular : def.label.plural).toLowerCase());
  const part = new Map((flagged.data ?? []).map((g) => [String(g.key), g.value]));
  if (top.length === 0)
    return (
      <Typography color="text.secondary" sx={{ px: 2.5, py: 3 }}>
        Nada por aqui.
      </Typography>
    );

  return (
    <List disablePadding>
      {top.map((g) => {
        const name = g.title ?? String(g.key);
        const over = part.get(String(g.key));
        const hot = over !== undefined && measureNumber(over) > 0;
        const chip = widget.flag && (hot ? widget.flag : widget.flag.otherwise);
        const tone = chip?.tone ?? (hot ? 'danger' : 'warning');
        return (
          <ListItem key={String(g.key)} divider sx={{ px: 2.5, py: 1.5, gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <ListItemAvatar sx={{ minWidth: 52 }}>
              <SoftAvatar tone={tone}>{initialsOf(name)}</SoftAvatar>
            </ListItemAvatar>
            <ListItemText primary={name} secondary={widget.caption ? caption(g.count) : undefined} sx={{ minWidth: 0, flex: 1 }} />
            <Stack sx={{ alignItems: 'flex-end', mx: { sm: 2 } }}>
              <Typography variant="subtitle1">{formatMeasure(String(g.amount), sum, locale)}</Typography>
              {chip && <StatusChip tone={tone} label={text(chip.label).replace('{value}', hot ? formatMeasure(over!, sum, locale) : '')} />}
            </Stack>
            {action && (
              <Button size="small" variant="outlined" onClick={() => void run(String(g.key))}>
                {text(action.label)}
              </Button>
            )}
          </ListItem>
        );
      })}
    </List>
  );
}
