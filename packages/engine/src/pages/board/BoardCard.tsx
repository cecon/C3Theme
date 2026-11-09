import { Draggable } from '@hello-pangea/dnd';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { SoftAvatar, visuallyHidden } from '@c3theme/ui';
import { iconByName, useText, type C3Icons } from '../../context';
import { findOption } from '../../format';
import type { EntityDef, FieldDef, RefValue, WireRecord } from '../../types';
import { recordTitle } from '../../views';
import { Cell } from '../list/Cell';
import { avatarTone } from '../list/richCell';
import DueChip from './DueChip';

interface BoardCardProps {
  def: EntityDef;
  row: WireRecord;
  index: number;
  fields: FieldDef[];
  draggable: boolean;
  /** Coluna de concluídos (`views.board.done`): título riscado e prazo verde. */
  done: boolean;
  onOpen: (row: WireRecord) => void;
  /** Catálogo de ícones do sistema (contadores). */
  icons?: C3Icons;
}

/** "Ana Beatriz Souza" → "AS": primeira e última palavra, como no quadro em código. */
const initials = (name: string) => {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
};

/**
 * Cartão do quadro: código, título, chips (enums e prazo), contadores e o avatar do responsável. Clicar (ou Enter)
 * abre o registro; arrastar (ou espaço + setas) muda a coluna. O cartão inteiro é a alça: nada de botão dentro dele,
 * porque o @hello-pangea/dnd não começa o arrasto com o mouse sobre elemento interativo (button, a, input).
 */
export default function BoardCard({ def, row, index, fields, draggable, done, onOpen, icons }: BoardCardProps) {
  const text = useText();
  const { locale } = useIntl();
  const board = def.views!.board!;
  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);
  const title = recordTitle(def, row) || `#${row.id}`;
  // campo que o usuário não pode ver (capabilities.fields) não aparece no cartão
  const shown = (name?: string) => (name && def.fields.some((f) => f.name === name && f.denied !== 'hidden') ? name : undefined);
  const [codeField, dueField, whoField] = [shown(board.code), shown(board.due), shown(board.assignee)];
  const code = codeField ? row[codeField] : undefined;
  const due = dueField ? row[dueField] : undefined;
  const who = whoField ? (row[whoField] as RefValue | null) : undefined;
  const chips = fields.filter((f) => f.type === 'enum');
  const lines = fields.filter((f) => f.type !== 'enum');
  const counters = (board.counters ?? []).filter((c) => shown(c.field) && Number(row[c.field]) > 0);

  return (
    <Draggable draggableId={row.id!} index={index} isDragDisabled={!draggable}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          // sem arrasto (somente leitura) o dnd não dá alça: o cartão continua focável e abre com Enter
          tabIndex={0}
          role="button"
          {...provided.dragHandleProps}
          variant="outlined"
          onClick={() => onOpen(row)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !snapshot.isDragging) onOpen(row);
          }}
          sx={(theme) => ({
            p: 1.5,
            mb: 1.25,
            borderRadius: 2,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'box-shadow .15s, border-color .15s',
            '&:hover': { borderColor: theme.vars.palette.primary.main },
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 1 },
            ...(snapshot.isDragging && { boxShadow: theme.shadows[8], borderColor: theme.vars.palette.primary.main })
          })}
        >
          {typeof code === 'string' && code !== '' && (
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              {code}
            </Typography>
          )}
          <Typography
            variant="subtitle2"
            sx={{ overflowWrap: 'anywhere', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.75 : 1 }}
          >
            {title}
          </Typography>
          {lines.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1, color: 'text.secondary', alignItems: 'flex-start' }}>
              {lines.map((f) => (
                <Cell key={f.name} field={f} row={row} locale={locale} optionLabel={optionLabel(f)} />
              ))}
            </Stack>
          )}
          {(chips.length > 0 || typeof due === 'string') && (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
              {chips.map((f) => (
                <Cell key={f.name} field={f} row={row} locale={locale} optionLabel={optionLabel(f)} />
              ))}
              {typeof due === 'string' && due !== '' && <DueChip due={due} done={done} locale={locale} />}
            </Stack>
          )}
          {(counters.length > 0 || whoField) && (
            <Stack direction="row" sx={{ alignItems: 'center', mt: 1.25 }}>
              <Stack direction="row" spacing={1.5}>
                {counters.map((c) => {
                  const Icon = iconByName(c.icon, icons);
                  const n = Number(row[c.field]);
                  return (
                    <Stack key={c.field} direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                      {Icon && <Icon size={14} />}
                      <Typography variant="caption">
                        {n}
                        <Box component="span" sx={visuallyHidden}>{` ${text(c.label, c.field)}`}</Box>
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              {whoField && (
                <Box sx={{ ml: 'auto' }}>
                  {who?.title ? (
                    <Tooltip title={who.title}>
                      <SoftAvatar tone={avatarTone(who.id)} size="xs" aria-label={who.title}>
                        {initials(who.title)}
                      </SoftAvatar>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Sem responsável">
                      <SoftAvatar tone="neutral" size="xs" look="outlined" sx={{ borderStyle: 'dashed' }}>
                        ?
                      </SoftAvatar>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </Paper>
      )}
    </Draggable>
  );
}
