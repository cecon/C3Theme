import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// third-party
import { addDays, addHours, isBefore, isValid, setHours, startOfDay, subDays } from 'date-fns';
import { TickCircle, Trash } from 'iconsax-reactjs';

import { eventToneMain } from '@c3theme/ui';
import { CalendarEvent, EVENT_TONES, EventTone } from './data';

export interface EventDraft {
  id?: string;
  title: string;
  description: string;
  allDay: boolean;
  start: Date;
  end: Date;
  tone: EventTone;
}

interface EventDialogProps {
  /** Evento a editar ou rascunho de um novo (sem id). */
  draft: EventDraft;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

/** No formulário o fim do evento de dia inteiro é inclusivo (o último dia); no calendário é exclusivo. */
function toForm(d: EventDraft): EventDraft {
  return d.allDay ? { ...d, end: subDays(d.end, 1) } : d;
}

function ColorPicker({ value, onChange }: { value: EventTone; onChange: (t: EventTone) => void }) {
  return (
    <Box role="radiogroup" aria-label="Cor do evento" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {EVENT_TONES.map(({ tone, label }) => {
        const selected = tone === value;
        return (
          <Tooltip key={tone} title={label}>
            <Box
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => onChange(tone)}
              sx={(theme) => ({
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 2,
                borderColor: selected ? eventToneMain(theme, tone) : 'transparent',
                p: '3px',
                bgcolor: 'transparent',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                '&:focus-visible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 2 }
              })}
            >
              <Box
                sx={(theme) => ({
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  bgcolor: eventToneMain(theme, tone),
                  color: 'common.white',
                  display: 'grid',
                  placeItems: 'center'
                })}
              >
                {selected && <TickCircle size={16} variant="Bold" />}
              </Box>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

/** Criar, editar e excluir um evento. */
export default function EventDialog({ draft, onClose, onSave, onDelete }: EventDialogProps) {
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const [form, setForm] = useState<EventDraft>(() => toForm(draft));
  const [touched, setTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setForm((f) => ({ ...f, [key]: value }));

  const titleError = touched && !form.title.trim();
  const datesValid = isValid(form.start) && isValid(form.end);
  const rangeError =
    datesValid && isBefore(form.allDay ? startOfDay(form.end) : form.end, form.allDay ? startOfDay(form.start) : form.start);

  function toggleAllDay(allDay: boolean) {
    setForm((f) => {
      if (allDay) return { ...f, allDay, start: startOfDay(f.start), end: startOfDay(f.end) };
      // ao sair do dia inteiro, sugere 9h às 10h
      const start = setHours(startOfDay(f.start), 9);
      return { ...f, allDay, start, end: addHours(start, 1) };
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.title.trim() || !datesValid || rangeError) return;
    const start = form.allDay ? startOfDay(form.start) : form.start;
    const end = form.allDay ? addDays(startOfDay(form.end), 1) : form.end;
    onSave({
      id: form.id ?? `ev-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      allDay: form.allDay,
      start,
      end,
      tone: form.tone
    });
  }

  const Picker = form.allDay ? DatePicker : DateTimePicker;

  return (
    <>
      <Dialog open onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <Box component="form" onSubmit={submit} noValidate sx={{ display: 'contents' }}>
          <DialogTitle>{form.id ? 'Editar evento' : 'Novo evento'}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid size={12}>
                <TextField
                  label="Título"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  error={titleError}
                  helperText={titleError && 'Informe o título.'}
                  fullWidth
                  autoFocus
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Descrição"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Grid>
              <Grid size={12}>
                <FormControlLabel
                  control={<Switch checked={form.allDay} onChange={(e) => toggleAllDay(e.target.checked)} />}
                  label="Dia inteiro"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Picker
                  label="Início"
                  value={form.start}
                  onChange={(v) => v && set('start', v)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Picker
                  label="Fim"
                  value={form.end}
                  minDate={form.start}
                  onChange={(v) => v && set('end', v)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: rangeError,
                      helperText: rangeError ? 'O fim deve ser depois do início.' : undefined
                    }
                  }}
                />
              </Grid>
              <Grid size={12}>
                <Stack spacing={1}>
                  <FormLabel component="span">Cor</FormLabel>
                  <ColorPicker value={form.tone} onChange={(t) => set('tone', t)} />
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            {form.id && (
              <Button color="error" startIcon={<Trash size={18} />} onClick={() => setConfirmDelete(true)} sx={{ mr: 'auto' }}>
                Excluir
              </Button>
            )}
            <Button color="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {form.id ? 'Salvar' : 'Criar evento'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir evento?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{form.title || 'Sem título'}” será removido do calendário. Essa ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={() => form.id && onDelete(form.id)}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
