// material-ui
import Box from '@mui/material/Box';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { unavailableReason, type ModelGroup } from '../core/models';
import ModelTags from './ModelTags';

export interface ModelListProps {
  id: string;
  label: string;
  groups: ModelGroup[];
  value: string | null;
  active: string | null;
  /** Id do elemento de cada opção, para o `aria-activedescendant` da busca. */
  optionId: (value: string) => string;
  onPick: (value: string) => void;
  onActive: (value: string) => void;
}

/**
 * Lista do seletor de modelo (`role="listbox"`), um `group` por provedor. O foco fica na busca; a opção ativa é
 * apontada por `aria-activedescendant`. Opção indisponível fica com `aria-disabled` e o motivo numa linha, ligado por
 * `aria-describedby`; as setas pulam ela.
 */
export default function ModelList({ id, label, groups, value, active, optionId, onPick, onActive }: ModelListProps) {
  return (
    <Box id={id} role="listbox" aria-label={label} sx={{ maxHeight: 360, overflowY: 'auto', py: 0.5 }}>
      {groups.map((g) => (
        <Box
          key={g.id}
          role={g.label ? 'group' : undefined}
          aria-label={g.label ? (g.status ? `${g.label}, ${g.status.label}` : g.label) : undefined}
        >
          {g.label && (
            <Box
              aria-hidden
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, pt: 1, pb: 0.5, typography: 'caption', fontWeight: 600 }}
            >
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {g.label}
              </Box>
              {g.status && <ModelTags tags={[g.status]} />}
            </Box>
          )}
          {g.options.map((o) => {
            const reason = unavailableReason(g, o);
            const selected = o.value === value;
            const oid = optionId(o.value);
            return (
              <Box
                key={o.value}
                id={oid}
                role="option"
                aria-selected={selected}
                aria-disabled={reason ? true : undefined}
                aria-describedby={reason ? `${oid}-why` : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => !reason && o.value !== active && onActive(o.value)}
                onClick={() => !reason && onPick(o.value)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  mx: 0.5,
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  cursor: reason ? 'default' : 'pointer',
                  bgcolor: o.value === active ? 'action.hover' : undefined
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
                    <Box component="span" sx={{ typography: 'body2', fontWeight: 500, color: reason ? 'text.secondary' : 'text.primary' }}>
                      {o.label}
                    </Box>
                    <ModelTags flags={o.flags} tags={o.tags} />
                  </Box>
                  {o.description && <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{o.description}</Box>}
                  {reason && (
                    <Box id={`${oid}-why`} sx={{ typography: 'caption', color: 'text.secondary', fontStyle: 'italic' }}>
                      {reason}
                    </Box>
                  )}
                </Box>
                {selected && <Box component={TickCircle} size={16} variant="Bold" aria-hidden sx={{ color: 'primary.main', mt: 0.25 }} />}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
