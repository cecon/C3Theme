import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { isAnswerReady, primaryOption, type AgentQuestion, type QuestionAnswer } from '../core/question';
import Shortcut, { SUBMIT_KEYS } from './Shortcut';
import { useChatText } from './text';

export interface QuestionInputsProps {
  question: AgentQuestion;
  /** Sem isso (o transporte não recebe respostas), tudo aparece desabilitado. */
  onAnswer?: (answer: QuestionAnswer) => void;
  /** Recebe a função de enviar do atalho Ctrl+Enter, para o card chamar. */
  submitRef: { current: (() => void) | null };
}

/**
 * Como se responde: um botão por opção (`single`, clicar já responde), caixas de marcar com "Responder"
 * (`multiple`) ou texto livre (`text`, ou `allowText` junto das opções). O Ctrl+Enter vai na opção principal ou
 * no "Responder".
 */
export default function QuestionInputs({ question: q, onAnswer, submitRef }: QuestionInputsProps) {
  const t = useChatText();
  const kind = q.kind ?? 'single';
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState('');
  const disabled = !onAnswer;
  const showText = kind === 'text' || !!q.allowText;
  const draft: QuestionAnswer = { optionIds: kind === 'multiple' && picked.length ? picked : undefined, text: text.trim() || undefined };
  const ready = isAnswerReady(draft);
  const primary = kind === 'single' ? primaryOption(q) : undefined;

  const send = () => ready && onAnswer?.(draft);
  // texto escrito ganha da opção principal: quem escreveu quer mandar o que escreveu
  submitRef.current = disabled ? null : ready ? send : primary ? () => onAnswer?.({ optionIds: [primary.id] }) : null;

  const textField = showText && (
    <TextField
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={q.placeholder ?? (kind === 'text' ? t('c3.chat.yourAnswer') : t('c3.chat.otherAnswer'))}
      disabled={disabled}
      multiline
      maxRows={5}
      size="small"
      fullWidth
      slotProps={{ htmlInput: { 'aria-label': t('c3.chat.yourAnswer') } }}
    />
  );
  const replyButton = (kind !== 'single' || text.trim()) && (
    <Button
      variant="contained"
      onClick={send}
      disabled={disabled || !ready}
      aria-keyshortcuts={SUBMIT_KEYS}
      sx={{ alignSelf: 'flex-start' }}
    >
      {t('c3.chat.reply')}
      <Shortcut />
    </Button>
  );

  if (kind === 'multiple') {
    return (
      <Stack spacing={1}>
        <Stack role="group" aria-label={q.prompt}>
          {q.options?.map((o) => (
            <FormControlLabel
              key={o.id}
              disabled={disabled}
              control={
                <Checkbox
                  size="small"
                  checked={picked.includes(o.id)}
                  onChange={(e) => setPicked((list) => (e.target.checked ? [...list, o.id] : list.filter((id) => id !== o.id)))}
                />
              }
              label={
                <span>
                  <Typography variant="body2" component="span">
                    {o.label}
                  </Typography>
                  {o.description && (
                    <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                      {o.description}
                    </Typography>
                  )}
                </span>
              }
              sx={{ alignItems: 'flex-start', mr: 0, '& .MuiCheckbox-root': { pt: 0.25 } }}
            />
          ))}
        </Stack>
        {textField}
        {replyButton}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
      {kind === 'single' && !!q.options?.length && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {q.options.map((o) => (
            <Button
              key={o.id}
              variant={o.primary ? 'contained' : 'outlined'}
              color={o.primary ? 'primary' : 'secondary'}
              disabled={disabled}
              title={o.description}
              aria-keyshortcuts={o.primary ? SUBMIT_KEYS : undefined}
              onClick={() => onAnswer?.({ optionIds: [o.id] })}
            >
              {o.label}
              {o.primary && <Shortcut />}
            </Button>
          ))}
        </Stack>
      )}
      {textField}
      {replyButton}
    </Stack>
  );
}
