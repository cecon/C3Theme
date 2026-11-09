import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Send2 } from 'iconsax-reactjs';

import { notify, Panel, StatusChip } from '@c3theme/ui';
import { RELEASE } from './data';

// data de referência fixa da vitrine
const TODAY = parseISO('2026-10-18');

/** Andamento de um lançamento: itens marcáveis e barra de progresso. */
export default function ReleaseCard() {
  const [items, setItems] = useState(RELEASE.items);
  const done = items.filter((i) => i.done).length;
  const progress = (done / items.length) * 100;
  const daysLeft = differenceInCalendarDays(parseISO(RELEASE.due), TODAY);

  return (
    <Panel title={`Versão ${RELEASE.version}`} action={<StatusChip label={`${daysLeft} dias`} tone={daysLeft < 7 ? 'warning' : 'info'} />}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
          {done} de {items.length} itens prontos
        </Typography>
        <Typography variant="subtitle2">{Math.round(progress)}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} aria-label="Progresso do lançamento" />
      <Stack sx={{ mt: 1.5 }}>
        {items.map((item) => (
          <FormControlLabel
            key={item.id}
            label={item.title}
            control={
              <Checkbox
                size="small"
                checked={item.done}
                onChange={() => setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
              />
            }
            sx={{ mr: 0, '& .MuiFormControlLabel-label': item.done ? { color: 'text.secondary', textDecoration: 'line-through' } : {} }}
          />
        ))}
      </Stack>
      <Button
        fullWidth
        variant="contained"
        startIcon={<Send2 size={18} />}
        disabled={done < items.length}
        sx={{ mt: 1.5 }}
        onClick={() => notify(`Versão ${RELEASE.version} publicada!`, 'success')}
      >
        {done < items.length ? `Faltam ${items.length - done} itens` : 'Publicar versão'}
      </Button>
    </Panel>
  );
}
