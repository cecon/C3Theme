import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { PRIORITY, Priority, Story, storyCode } from '../data';
import { newId, useKanban } from '../KanbanContext';

interface StoryDialogProps {
  /** História a editar; sem ela, cria uma nova. */
  story?: Story;
  onClose: () => void;
  onSaved: (story: Story, created: boolean) => void;
}

/** Formulário de criação e edição de história de usuário. */
export default function StoryDialog({ story, onClose, onSaved }: StoryDialogProps) {
  const { data } = useKanban();
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const nextCode = Math.max(0, ...Object.values(data.stories).map((s) => s.code)) + 1;

  const [form, setForm] = useState<Story>(
    () =>
      story ?? {
        id: newId('s'),
        code: nextCode,
        title: '',
        description: '',
        acceptance: '',
        assigneeId: null,
        priority: 'media',
        columnId: data.columnOrder[0] ?? '',
        due: null,
        cardIds: [],
        comments: []
      }
  );
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof Story>(key: K, value: Story[K]) => setForm((f) => ({ ...f, [key]: value }));
  const titleError = touched && !form.title.trim();

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.title.trim()) return;
    onSaved({ ...form, title: form.title.trim(), description: form.description.trim(), acceptance: form.acceptance.trim() }, !story);
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <Box component="form" onSubmit={submit} noValidate sx={{ display: 'contents' }}>
        <DialogTitle>{story ? `Editar ${storyCode(story.code)}` : 'Nova história de usuário'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <TextField
                label="Título"
                placeholder="Como <perfil>, quero <objetivo> para <benefício>"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                error={titleError}
                helperText={titleError && 'Informe o título.'}
                required
                autoFocus
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Descrição"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Critérios de aceitação"
                helperText="Um critério por linha."
                value={form.acceptance}
                onChange={(e) => set('acceptance', e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Responsável"
                value={form.assigneeId ?? ''}
                onChange={(e) => set('assigneeId', e.target.value || null)}
                fullWidth
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">
                  <em>Sem responsável</em>
                </MenuItem>
                {data.members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Prioridade"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as Priority)}
                fullWidth
              >
                {(Object.keys(PRIORITY) as Priority[]).map((p) => (
                  <MenuItem key={p} value={p}>
                    {PRIORITY[p].label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Situação" value={form.columnId} onChange={(e) => set('columnId', e.target.value)} fullWidth>
                {data.columnOrder.map((id) => (
                  <MenuItem key={id} value={id}>
                    {data.columns[id].title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Prazo"
                value={form.due}
                onChange={(v) => set('due', v)}
                slotProps={{ textField: { fullWidth: true }, field: { clearable: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            {story ? 'Salvar' : 'Criar história'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
