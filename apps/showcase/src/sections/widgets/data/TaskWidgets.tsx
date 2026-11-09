import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Add, Trash } from 'iconsax-reactjs';

import { Dot, LinearWithLabel, notify, Panel, SoftAvatar, StatusChip } from '@c3theme/ui';
import { DELIVERIES, MY_TASKS, TodoItem, TODOS } from '../data';
import { Period } from '../kit/period';
import { PeriodMenu } from '../kit/PeriodMenu';

/** Linha vertical que liga os itens de uma linha do tempo. */
const timelineSx = {
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    insetInlineStart: 4,
    top: 8,
    bottom: 8,
    width: 2,
    bgcolor: 'divider'
  }
} as const;

/** Tarefas do dia em linha do tempo, com horário e etiqueta. */
export function MyTasksCard() {
  const [period, setPeriod] = useState<Period>('dia');
  const tasks = period === 'dia' ? MY_TASKS : [...MY_TASKS].reverse();
  return (
    <Panel title="Minhas tarefas" action={<PeriodMenu value={period} onChange={setPeriod} options={['dia', 'semana', 'mes']} />}>
      <Stack spacing={2.5} sx={timelineSx}>
        {tasks.map((t) => (
          <Stack key={t.title} direction="row" spacing={2} sx={{ position: 'relative' }}>
            <Box sx={{ pt: 0.75, zIndex: 1, display: 'flex' }}>
              <Dot tone={t.tone} size={10} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {t.time}
              </Typography>
              <Typography variant="subtitle2">{t.title}</Typography>
            </Box>
            <Box>
              <StatusChip label={t.tag} tone={t.tone} />
            </Box>
          </Stack>
        ))}
      </Stack>
    </Panel>
  );
}

/** Lista de afazeres: marcar, incluir e excluir itens. */
export function TodoListCard() {
  const [items, setItems] = useState<TodoItem[]>(TODOS);
  const [text, setText] = useState('');
  const done = items.filter((i) => i.done).length;

  function add(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setItems((list) => [...list, { id: Math.max(0, ...list.map((i) => i.id)) + 1, text: value, done: false }]);
    setText('');
    notify('Item incluído.', 'success');
  }

  return (
    <Panel title="Lista de afazeres" subtitle={`${done} de ${items.length} concluídos`} flush>
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem
            key={item.id}
            divider
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                aria-label={`Excluir "${item.text}"`}
                onClick={() => {
                  setItems((list) => list.filter((i) => i.id !== item.id));
                  notify('Item excluído.', 'info');
                }}
              >
                <Trash size={16} />
              </IconButton>
            }
            sx={{ pl: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Checkbox
                edge="start"
                checked={item.done}
                onChange={() => setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                slotProps={{ input: { 'aria-label': item.text } }}
              />
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              slotProps={{ primary: { sx: item.done ? { textDecoration: 'line-through', color: 'text.secondary' } : undefined } }}
            />
          </ListItem>
        ))}
      </List>
      <Stack component="form" onSubmit={add} direction="row" spacing={1} sx={{ p: 2 }}>
        <TextField size="small" fullWidth label="Novo item" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" variant="contained" disabled={!text.trim()} aria-label="Incluir item">
          <Add size={18} />
        </Button>
      </Stack>
    </Panel>
  );
}

const TASK_TAGS = ['Urgente', 'Cliente', 'Interno'] as const;

/** Progresso das tarefas da semana e um formulário rápido para criar outra. */
export function AddTaskCard() {
  const [total, setTotal] = useState(24);
  const [completed, setCompleted] = useState(17);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState<(typeof TASK_TAGS)[number]>('Interno');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setTotal((t) => t + 1);
    notify(`Tarefa "${title.trim()}" criada (${tag}).`, 'success');
    setTitle('');
  }

  return (
    <Panel title="Nova tarefa">
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <SoftAvatar tone="success" variant="rounded">
          <Typography variant="subtitle2" sx={{ color: 'inherit' }}>
            {completed}
          </Typography>
        </SoftAvatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Tarefas concluídas</Typography>
          <Typography variant="caption" color="text.secondary">
            {completed} de {total} nesta semana
          </Typography>
        </Box>
      </Stack>
      <LinearWithLabel value={(completed / total) * 100} color="success" />
      <Button size="small" sx={{ mt: 0.5 }} onClick={() => setCompleted((c) => Math.min(total, c + 1))} disabled={completed >= total}>
        Marcar uma como concluída
      </Button>
      <Box component="form" onSubmit={submit} sx={{ mt: 2.5 }}>
        <TextField size="small" fullWidth label="Título da tarefa" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Stack direction="row" spacing={1} sx={{ my: 1.5, flexWrap: 'wrap' }} role="radiogroup" aria-label="Etiqueta">
          {TASK_TAGS.map((t) => (
            <Button
              key={t}
              size="small"
              role="radio"
              aria-checked={tag === t}
              variant={tag === t ? 'contained' : 'outlined'}
              color={t === 'Urgente' ? 'error' : t === 'Cliente' ? 'primary' : 'inherit'}
              onClick={() => setTag(t)}
            >
              {t}
            </Button>
          ))}
        </Stack>
        <Button type="submit" fullWidth variant="contained" startIcon={<Add size={18} />} disabled={!title.trim()}>
          Criar tarefa
        </Button>
      </Box>
    </Panel>
  );
}

/** Próximas entregas com a data em destaque. */
export function DeliveriesCard() {
  return (
    <Panel title="Próximas entregas" flush>
      <List disablePadding>
        {DELIVERIES.map((d, i) => {
          const date = parseISO(d.date);
          return (
            <ListItem key={d.title} divider={i < DELIVERIES.length - 1} sx={{ px: 2.5, py: 1.5, gap: 2 }}>
              <SoftAvatar tone={d.tone} variant="rounded" size="lg" sx={{ flexDirection: 'column', lineHeight: 1.1 }}>
                <Typography variant="h5" component="span" sx={{ color: 'inherit' }}>
                  {format(date, 'dd')}
                </Typography>
                <Typography variant="caption" component="span" sx={{ color: 'inherit', textTransform: 'uppercase' }}>
                  {format(date, 'MMM', { locale: ptBR })}
                </Typography>
              </SoftAvatar>
              <ListItemText
                primary={d.title}
                secondary={`${format(date, 'EEEE', { locale: ptBR })} · ${d.detail}`}
                slotProps={{ primary: { variant: 'subtitle2' } }}
              />
            </ListItem>
          );
        })}
      </List>
    </Panel>
  );
}
