import { ReactNode, useContext, useId } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

import { DISABLED_OPACITY, SettingsGroupContext } from './context';

export interface SettingsChecklistItem {
  id: string;
  label: ReactNode;
  /** texto curto ao lado do nome (ex.: o papel do agente) */
  hint?: ReactNode;
  /** avatar opcional antes do nome (SoftAvatar size="xs", ícone...) */
  avatar?: ReactNode;
}

export interface SettingsChecklistProps {
  label: ReactNode;
  description?: ReactNode;
  items: SettingsChecklistItem[];
  /** ids marcados */
  value: string[];
  onChange: (value: string[]) => void;
  dependent?: boolean;
  disabled?: boolean;
}

/** Escolha múltipla dentro de um grupo (ex.: "Agentes na doca"): uma caixa de seleção por item, avatar opcional. */
export default function SettingsChecklist({
  label,
  description,
  items,
  value,
  onChange,
  dependent = false,
  disabled = false
}: SettingsChecklistProps) {
  const { dependentsDisabled } = useContext(SettingsGroupContext);
  const off = disabled || (dependent && dependentsDisabled);
  const labelId = useId();
  const descId = useId();
  const toggle = (id: string, on: boolean) => onChange(on ? [...value.filter((v) => v !== id), id] : value.filter((v) => v !== id));
  return (
    <Box
      role="group"
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      aria-disabled={off || undefined}
      sx={{ px: 2, pt: 1.25, pb: 0.75 }}
    >
      <Typography id={labelId} variant="body2" sx={{ fontWeight: 600, opacity: off ? DISABLED_OPACITY : 1 }}>
        {label}
      </Typography>
      {description && (
        <Typography
          id={descId}
          variant="caption"
          component="p"
          color="text.secondary"
          sx={{ mt: 0.25, opacity: off ? DISABLED_OPACITY : 1 }}
        >
          {description}
        </Typography>
      )}
      <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 0.5, p: 0 }}>
        {items.map((item, i) => (
          <Box component="li" key={item.id}>
            <Box
              component="label"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25, cursor: off ? 'default' : 'pointer', ml: -0.75 }}
            >
              <Checkbox
                size="small"
                checked={value.includes(item.id)}
                disabled={off}
                onChange={(_, on) => toggle(item.id, on)}
                // nome = só o rótulo do item (sem as iniciais do avatar); a dica vira descrição
                slotProps={{
                  input: { 'aria-labelledby': `${labelId}-${i}`, 'aria-describedby': item.hint ? `${labelId}-${i}-hint` : undefined }
                }}
                sx={{ p: 0.75 }}
              />
              {item.avatar}
              <Typography id={`${labelId}-${i}`} variant="body2" component="span" sx={{ opacity: off ? DISABLED_OPACITY : 1 }}>
                {item.label}
              </Typography>
              {item.hint && (
                <Typography
                  id={`${labelId}-${i}-hint`}
                  variant="caption"
                  component="span"
                  color="text.secondary"
                  sx={{ opacity: off ? DISABLED_OPACITY : 1 }}
                >
                  {item.hint}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
