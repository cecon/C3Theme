// material-ui
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2, ArrowUp2 } from 'iconsax-reactjs';

import type { DraftStep, planAllows } from '../../core/hitlPlan';
import { useChatText } from '../text';
import { secondarySx } from './sx';

export interface PlanStepRowProps {
  step: DraftStep;
  index: number;
  last: boolean;
  allows: ReturnType<typeof planAllows>;
  disabled: boolean;
  onToggle: () => void;
  onRename: (text: string) => void;
  onMove: (to: number) => void;
}

/** Um passo do plano: marcar, o texto editável no lugar, a linha de detalhe e as setas de ordem. */
export default function PlanStepRow({ step, index, last, allows, disabled, onToggle, onRename, onMove }: PlanStepRowProps) {
  const t = useChatText();
  const n = index + 1;
  const label = t('c3.chat.plan.step', { n });
  return (
    <Stack
      component="li"
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: 'flex-start',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        px: 0.5,
        py: 0.25,
        opacity: step.enabled ? 1 : 0.6
      }}
    >
      <Checkbox
        size="small"
        checked={step.enabled}
        onChange={onToggle}
        disabled={disabled || step.required || !allows.remove}
        slotProps={{ input: { 'aria-label': label } }}
      />
      <Stack sx={{ flex: 1, minWidth: 0, py: 0.75 }}>
        {allows.edit ? (
          <InputBase
            value={step.text}
            onChange={(e) => onRename(e.target.value)}
            disabled={disabled || !step.enabled}
            multiline
            inputProps={{ 'aria-label': label }}
            sx={{ typography: 'body2', p: 0, textDecoration: step.enabled ? 'none' : 'line-through' }}
          />
        ) : (
          <Typography variant="body2" sx={{ textDecoration: step.enabled ? 'none' : 'line-through' }}>
            {step.text}
          </Typography>
        )}
        {(step.detail || step.required) && (
          <Typography variant="caption" sx={secondarySx}>
            {[step.required ? t('c3.chat.plan.required') : '', step.detail ?? ''].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </Stack>
      {allows.reorder && (
        <Stack direction="row">
          <Tooltip title={t('c3.chat.plan.up', { n })}>
            <span>
              <IconButton
                size="small"
                aria-label={t('c3.chat.plan.up', { n })}
                disabled={disabled || index === 0}
                onClick={() => onMove(index - 1)}
              >
                <ArrowUp2 size={16} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t('c3.chat.plan.down', { n })}>
            <span>
              <IconButton
                size="small"
                aria-label={t('c3.chat.plan.down', { n })}
                disabled={disabled || last}
                onClick={() => onMove(index + 1)}
              >
                <ArrowDown2 size={16} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  );
}
