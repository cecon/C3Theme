import { ChangeEvent, ReactNode, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// third-party
import { CloseCircle, DocumentText, Paperclip2, Trash } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';
import CommentList from './CommentList';
import { Card, CURRENT_USER, formatBytes, PRIORITY, Priority, storyCode } from './data';
import { newId, useKanban } from './KanbanContext';
import { ConfirmDialog } from './shared';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function CardForm({ card, onClose }: { card: Card; onClose: () => void }) {
  const { data, dispatch, columnOf, storyOf } = useKanban();
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const column = columnOf(card.id);
  const story = storyOf(card.id);

  const patch = (p: Partial<Omit<Card, 'id'>>) => dispatch({ type: 'updateCard', id: card.id, patch: p });

  function pickFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).map((f) => ({ id: newId('f'), name: f.name, size: f.size }));
    if (files.length) {
      patch({ attachments: [...card.attachments, ...files] });
      notify(files.length > 1 ? `${files.length} anexos adicionados.` : 'Anexo adicionado.', 'success');
    }
    e.target.value = '';
  }

  return (
    <Stack sx={{ height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, minHeight: 64 }}>
        <Box>
          <Typography variant="h5" component="h2">
            Detalhes do cartão
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {story ? `${storyCode(story.code)} · ` : ''}
            {column?.title ?? 'Sem coluna'} · alterações salvas automaticamente
          </Typography>
        </Box>
        <IconButton aria-label="Fechar detalhes" onClick={onClose}>
          <CloseCircle size={20} />
        </IconButton>
      </Stack>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                label="Título"
                value={card.title}
                onChange={(e) => patch({ title: e.target.value })}
                error={!card.title.trim()}
                helperText={!card.title.trim() && 'Informe o título.'}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Descrição"
                value={card.description}
                onChange={(e) => patch({ description: e.target.value })}
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Coluna"
                value={column?.id ?? ''}
                onChange={(e) => dispatch({ type: 'moveCard', cardId: card.id, toColumn: e.target.value, toIndex: Infinity })}
                fullWidth
              >
                {data.columnOrder.map((id) => (
                  <MenuItem key={id} value={id}>
                    {data.columns[id].title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="História"
                value={story?.id ?? ''}
                onChange={(e) => dispatch({ type: 'setCardStory', cardId: card.id, storyId: e.target.value || null })}
                fullWidth
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {data.storyOrder.map((id) => (
                  <MenuItem key={id} value={id} sx={{ whiteSpace: 'normal' }}>
                    {storyCode(data.stories[id].code)} · {data.stories[id].title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Responsável"
                value={card.assigneeId ?? ''}
                onChange={(e) => patch({ assigneeId: e.target.value || null })}
                fullWidth
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">
                  <em>Sem responsável</em>
                </MenuItem>
                {data.members.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name} {m.id === CURRENT_USER && '(você)'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Prazo"
                value={card.due}
                onChange={(v) => patch({ due: v })}
                slotProps={{ textField: { fullWidth: true }, field: { clearable: true } }}
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }} id="card-priority">
                Prioridade
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={card.priority}
                onChange={(_, v: Priority | null) => v && patch({ priority: v })}
                aria-labelledby="card-priority"
              >
                {(Object.keys(PRIORITY) as Priority[]).map((p) => (
                  <ToggleButton key={p} value={p} sx={{ px: 2, textTransform: 'none' }}>
                    {PRIORITY[p].label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          <Section title={`Anexos (${card.attachments.length})`}>
            <Stack spacing={1}>
              {card.attachments.map((f) => (
                <Stack
                  key={f.id}
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: 'center', p: 1, borderRadius: 2, border: 1, borderColor: 'divider' }}
                >
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>
                    <DocumentText size={22} variant="Bulk" />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {f.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(f.size)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    aria-label={`Remover ${f.name}`}
                    onClick={() => patch({ attachments: card.attachments.filter((a) => a.id !== f.id) })}
                  >
                    <Trash size={16} />
                  </IconButton>
                </Stack>
              ))}
              <Box>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Paperclip2 size={16} />}
                  onClick={() => fileRef.current?.click()}
                >
                  Anexar arquivo
                </Button>
                <input ref={fileRef} type="file" multiple hidden onChange={pickFiles} aria-hidden tabIndex={-1} />
              </Box>
            </Stack>
          </Section>

          <Section title={`Comentários (${card.comments.length})`}>
            <CommentList
              comments={card.comments}
              members={data.members}
              onAdd={(text) =>
                dispatch({
                  type: 'addCardComment',
                  cardId: card.id,
                  comment: { id: newId('k'), authorId: CURRENT_USER, text, at: new Date() }
                })
              }
            />
          </Section>
        </Stack>
      </Box>

      <Divider />
      <Stack direction="row" sx={{ justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
        <Button color="error" startIcon={<Trash size={18} />} onClick={() => setConfirm(true)}>
          Excluir cartão
        </Button>
        <Button variant="contained" onClick={onClose}>
          Concluir
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirm}
        title="Excluir cartão?"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          dispatch({ type: 'deleteCard', id: card.id });
          notify('Cartão excluído.', 'success');
          onClose();
        }}
      >
        “{card.title || 'Sem título'}” será removido do quadro e do backlog.
      </ConfirmDialog>
    </Stack>
  );
}

/** Gaveta de detalhes do cartão aberto (usada no quadro e no backlog). */
export default function CardDrawer() {
  const { data, openCardId, openCard } = useKanban();
  const card = openCardId ? data.cards[openCardId] : undefined;
  const close = () => openCard(null);

  return (
    <Drawer anchor="right" open={!!card} onClose={close} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 } } } }}>
      {card && <CardForm key={card.id} card={card} onClose={close} />}
    </Drawer>
  );
}
