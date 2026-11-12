// material-ui
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Hierarchy, MessageQuestion } from 'iconsax-reactjs';

import { sortLanes, type Lane } from '../../core/lanes';
import { useDayFormat } from '../format';
import { useChatText } from '../text';

export interface LaneListProps {
  lanes: readonly Lane[];
  onSelect: (id: string) => void;
}

/** Lista das conversas à parte: as que trabalham em cima, cada uma com o tipo (à parte ou ramo) e a última frase. */
export default function LaneList({ lanes, onSelect }: LaneListProps) {
  const t = useChatText();
  const day = useDayFormat();
  if (lanes.length === 0) {
    return (
      <Stack spacing={1} sx={{ px: 3, py: 6, textAlign: 'center' }}>
        <Typography variant="subtitle1">{t('c3.chat.lanes.empty')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('c3.chat.lanes.emptyHint')}
        </Typography>
      </Stack>
    );
  }
  return (
    <List aria-label={t('c3.chat.lanes')} sx={{ overflowY: 'auto', flex: 1, minHeight: 0, py: 0.5 }}>
      {sortLanes(lanes).map((lane) => (
        <ListItemButton key={lane.id} onClick={() => onSelect(lane.id)} sx={{ alignItems: 'flex-start', py: 1 }}>
          <ListItemIcon sx={{ minWidth: 36, mt: 0.5, color: 'text.secondary' }}>
            {lane.kind === 'branch' ? <Hierarchy size={20} /> : <MessageQuestion size={20} />}
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {lane.title}
                </Typography>
                {lane.working ? (
                  <Chip size="small" color="primary" variant="outlined" label={t('c3.chat.lanes.working')} />
                ) : (
                  <Typography variant="caption" color="text.secondary" component="time" dateTime={lane.updatedAt}>
                    {day.short(lane.updatedAt)}
                  </Typography>
                )}
              </Stack>
            }
            secondary={
              <>
                {t(lane.kind === 'branch' ? 'c3.chat.lanes.branch' : 'c3.chat.lanes.aside')}
                {lane.lastMessage?.text && ` · ${lane.lastMessage.text}`}
              </>
            }
            slotProps={{ secondary: { noWrap: true } }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}
