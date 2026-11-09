import useSWR from 'swr';

// material-ui
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SoftAvatar } from '@c3theme/ui';
import { iconByName, useEngine } from '../../context';
import { FeedWidget as Feed, widgetWhere } from '../../dashboard';
import { findOption } from '../../format';
import { recordTitle } from '../../views';
import WidgetError from './WidgetError';

/** "há 12 min", "há 3 h", "ontem", "há 2 dias" (ou a data, depois de uma semana). */
export function timeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const min = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  if (min < 24 * 60) return `há ${Math.floor(min / 60)} h`;
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(then)) / 86_400_000);
  if (days <= 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  return then.toLocaleDateString();
}

/** Avisos recentes: ícone e cor pelo enum `kind`, título do registro, `text` embaixo e há quanto tempo. */
export default function FeedWidget({ widget }: { widget: Feed }) {
  const { client, entities, icons, org } = useEngine();
  const { def } = entities[widget.entity];
  const where = widgetWhere(widget, def);
  const limit = widget.limit ?? 5;
  const { data, error } = useSWR(['c3-list', widget.entity, 'feed', JSON.stringify(where), limit, org?.active], () =>
    client.list(widget.entity, { pageSize: limit, sort: `-${widget.time}`, where })
  );
  const kind = def.fields.find((f) => f.name === widget.kind);

  if (error) return <WidgetError error={error} />;
  if (!data)
    return (
      <Stack sx={{ p: 2.5 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={56} />
        ))}
      </Stack>
    );
  return (
    <List disablePadding>
      {data.data.map((r) => {
        const value = String(r[widget.kind] ?? '');
        const Icon = iconByName(widget.icons?.[value], icons);
        const tone = (kind && findOption(kind, value)?.color) || 'info';
        const time = r[widget.time];
        return (
          <ListItem key={r.id} divider alignItems="flex-start" sx={{ px: 2.5, py: 1.5 }}>
            <ListItemAvatar sx={{ minWidth: 52 }}>
              <SoftAvatar tone={tone} size="sm" variant="rounded">
                {Icon ? <Icon size={16} /> : null}
              </SoftAvatar>
            </ListItemAvatar>
            <ListItemText primary={recordTitle(def, r)} secondary={widget.text ? String(r[widget.text] ?? '') : undefined} />
            {typeof time === 'string' && (
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1, mt: 0.5 }}>
                {timeAgo(time)}
              </Typography>
            )}
          </ListItem>
        );
      })}
    </List>
  );
}
