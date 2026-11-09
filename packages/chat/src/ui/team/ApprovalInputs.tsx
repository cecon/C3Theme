import { useId, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import type { AgentQuestion, QuestionAnswer } from '../../core/question';
import { approvalAnswer } from '../../core/team';
import Shortcut, { SUBMIT_KEYS } from '../Shortcut';
import { useChatText } from '../text';
import { Payload } from '../ToolStep';

export interface ApprovalInputsProps {
  question: AgentQuestion;
  onAnswer?: (answer: QuestionAnswer) => void;
  /** Recebe o "Permitir uma vez" para o Ctrl+Enter do card. */
  submitRef: { current: (() => void) | null };
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/**
 * Corpo do pedido de aprovação: a ferramenta (nome para gente e o técnico), os argumentos recolhidos e os três
 * botões. "Permitir uma vez" é o principal (Ctrl+Enter); "Sempre permitir" fica ao lado, sem destaque, para não ser
 * o clique automático.
 */
export default function ApprovalInputs({ question: q, onAnswer, submitRef }: ApprovalInputsProps) {
  const t = useChatText();
  const [open, setOpen] = useState(false);
  const argsId = useId();
  const tool = q.tool;
  const disabled = !onAnswer;
  submitRef.current = disabled ? null : () => onAnswer?.(approvalAnswer('once'));

  return (
    <Stack spacing={1.25}>
      {tool && (
        <Box>
          <Typography
            variant="body2"
            component="p"
            sx={{ fontFamily: mono, fontSize: 13, color: 'text.secondary', overflowWrap: 'anywhere' }}
          >
            {tool.name}
          </Typography>
          {tool.input && (
            <>
              <Button
                size="small"
                color="secondary"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={argsId}
                endIcon={
                  <Box component={ArrowDown2} size={14} sx={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
                }
                sx={{ ml: -1, mt: 0.25 }}
              >
                {t('c3.chat.approval.args')}
              </Button>
              <Collapse in={open} unmountOnExit>
                <Box id={argsId} sx={{ pt: 0.5 }}>
                  <Payload label={t('c3.chat.input')} text={tool.input} />
                </Box>
              </Collapse>
            </>
          )}
        </Box>
      )}
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" disabled={disabled} aria-keyshortcuts={SUBMIT_KEYS} onClick={() => onAnswer?.(approvalAnswer('once'))}>
          {t('c3.chat.allowOnce')}
          <Shortcut />
        </Button>
        <Button variant="outlined" color="secondary" disabled={disabled} onClick={() => onAnswer?.(approvalAnswer('always'))}>
          {t('c3.chat.allowAlways')}
        </Button>
        <Button variant="outlined" color="error" disabled={disabled} onClick={() => onAnswer?.(approvalAnswer('decline'))}>
          {t('c3.chat.decline')}
        </Button>
      </Stack>
    </Stack>
  );
}
