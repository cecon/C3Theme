// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Lock, People, Profile, Trash, Unlock } from 'iconsax-reactjs';

import EmptyState from '../EmptyState';
import InlineAdd from '../InlineAdd';
import SoftAvatar from '../SoftAvatar';
import StatusChip from '../StatusChip';
import { AllowAccess, AllowEntry, AllowKind, findEntry, formatPhone, parseAllowValue } from './allowRules';
import { useDeviceText } from './text';

export interface AllowListProps {
  entries: AllowEntry[];
  /** Novo contato ou grupo, já validado e normalizado (telefone só com dígitos). O app cria o id. */
  onAdd: (entry: { kind: AllowKind; value: string; access: AllowAccess }) => void;
  /** Sem ele o botão de liberar/bloquear não aparece. */
  onChangeAccess?: (entry: AllowEntry, access: AllowAccess) => void;
  /** Sem ele o botão de tirar da lista não aparece. */
  onRemove?: (entry: AllowEntry) => void;
  /** Como entra o que for adicionado pelo campo. */
  defaultAccess?: AllowAccess;
}

const shown = (entry: AllowEntry) => (entry.kind === 'contact' ? formatPhone(entry.value) : entry.value);

/** Contatos e grupos liberados ou bloqueados: etiqueta com texto (não só cor) e campo para adicionar. */
export default function AllowList({ entries, onAdd, onChangeAccess, onRemove, defaultAccess = 'allowed' }: AllowListProps) {
  const t = useDeviceText();

  function validate(text: string) {
    const parsed = parseAllowValue(text);
    if (!parsed.ok) return t('c3.allow.invalid');
    return findEntry(entries, parsed.kind, parsed.value) ? t('c3.allow.duplicate') : undefined;
  }

  function add(text: string) {
    const parsed = parseAllowValue(text);
    if (parsed.ok) onAdd({ kind: parsed.kind, value: parsed.value, access: defaultAccess });
  }

  return (
    <Stack spacing={1}>
      {entries.length ? (
        <Box component="ul" aria-label={t('c3.allow.title')} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {entries.map((entry) => {
            const name = entry.label || shown(entry);
            const blocked = entry.access === 'blocked';
            const toggle = blocked ? t('c3.allow.unblock', { name }) : t('c3.allow.block', { name });
            return (
              <Stack
                component="li"
                key={entry.id}
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', py: 1.25, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}
              >
                <SoftAvatar size="sm" tone={entry.kind === 'group' ? 'info' : 'neutral'} aria-hidden>
                  {entry.kind === 'group' ? <People size={18} /> : <Profile size={18} />}
                </SoftAvatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="p">
                    {entry.kind === 'group' ? t('c3.allow.group') : t('c3.allow.contact')}
                    {entry.label ? ` · ${shown(entry)}` : ''}
                  </Typography>
                </Box>
                <StatusChip label={blocked ? t('c3.allow.blocked') : t('c3.allow.allowed')} tone={blocked ? 'danger' : 'success'} />
                {onChangeAccess && (
                  <Tooltip title={toggle}>
                    <IconButton size="small" aria-label={toggle} onClick={() => onChangeAccess(entry, blocked ? 'allowed' : 'blocked')}>
                      {blocked ? <Unlock size={18} /> : <Lock size={18} />}
                    </IconButton>
                  </Tooltip>
                )}
                {onRemove && (
                  <Tooltip title={t('c3.allow.remove', { name })}>
                    <IconButton size="small" aria-label={t('c3.allow.remove', { name })} onClick={() => onRemove(entry)}>
                      <Trash size={18} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            );
          })}
        </Box>
      ) : (
        <EmptyState dense title={t('c3.allow.empty')} />
      )}
      <InlineAdd label={t('c3.allow.add')} placeholder={t('c3.allow.placeholder')} onAdd={add} validate={validate} />
    </Stack>
  );
}
