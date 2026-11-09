import { useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { DocumentText, Microphone2, Paperclip2, Send2, Stop } from 'iconsax-reactjs';

import { SoftIconButton } from '@c3theme/ui';
import { useBytesFormat } from './format';
import { useChatText } from './text';
import VoiceBar from './VoiceBar';
import useVoiceRecorder from '../hooks/useVoiceRecorder';

export interface ComposerProps {
  /** Texto controlado: ligue no `useDraft` para o rascunho sobreviver à troca de conversa. */
  value: string;
  onChange: (text: string) => void;
  /** Enviar. Depois disso o app limpa o texto (ex.: `clear` do `useDraft`); os arquivos o Composer limpa. */
  onSend: (text: string, files: File[]) => void;
  /** A cada tecla: ligue no `typed` do `useTypingStatus`. */
  onTyping?: () => void;
  /** Anexar arquivos. Padrão: ligado. */
  files?: boolean;
  /** Tipos aceitos no anexo, como no `accept` do input ("image/*,.pdf"). */
  accept?: string;
  /** Gravar áudio (só aparece com microfone no navegador). Padrão: ligado. */
  voice?: boolean;
  /** Botões extras antes do anexo: emoji, respostas prontas, modelos. */
  actions?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
  /** Assistente respondendo: dá para escrever a próxima, mas não enviar; o botão vira Parar (com `onStop`). */
  busy?: boolean;
  onStop?: () => void;
  /** Linha de ajuda embaixo da caixa, ex.: `t('c3.chat.hint')`. */
  hint?: ReactNode;
}

/** Caixa de mensagem: Enter envia, Shift+Enter quebra linha; anexos e áudio; Parar enquanto o assistente responde. */
export default function Composer(props: ComposerProps) {
  const { value, onChange, onSend, onTyping, files: allowFiles = true, accept, voice = true, actions, disabled, placeholder } = props;
  const { busy, onStop, hint } = props;
  const t = useChatText();
  const bytes = useBytesFormat();
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sendAudio = (audio: Blob) =>
    onSend('', [new File([audio], `audio-${Date.now()}.${audio.type.includes('ogg') ? 'ogg' : 'webm'}`, { type: audio.type })]);
  const recorder = useVoiceRecorder({ onAutoStop: sendAudio });

  const canSend = !disabled && !busy && (value.trim().length > 0 || files.length > 0);

  function send() {
    if (!canSend) return;
    onSend(value.trim(), files);
    setFiles([]);
    inputRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles((list) => [...list, ...picked.filter((p) => !list.some((l) => l.name === p.name && l.size === p.size))]);
    e.target.value = '';
  }

  if (recorder.state === 'recording') {
    return (
      <VoiceBar
        elapsedMs={recorder.elapsedMs}
        onCancel={recorder.cancel}
        onStop={() => void recorder.stop().then((audio) => audio && sendAudio(audio))}
      />
    );
  }

  const showMic = voice && !busy && recorder.state !== 'unsupported' && !value.trim() && files.length === 0;
  const showStop = busy && !!onStop;
  return (
    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.5 }}>
      {files.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {files.map((f) => (
            <Chip
              key={`${f.name}:${f.size}`}
              icon={<DocumentText size={16} />}
              label={`${f.name} · ${bytes(f.size)}`}
              onDelete={() => setFiles((list) => list.filter((l) => l !== f))}
              variant="outlined"
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKey}
          placeholder={placeholder ?? t('c3.chat.placeholder')}
          disabled={disabled}
          multiline
          maxRows={6}
          fullWidth
          size="small"
          helperText={recorder.state === 'denied' ? t('c3.chat.micDenied') : hint}
          slotProps={{
            htmlInput: { 'aria-label': t('c3.chat.message') },
            input: {
              sx: { borderRadius: 3, alignItems: 'flex-end', py: 0.75, pr: 0.5 },
              endAdornment: (
                <Stack direction="row" sx={{ mb: -0.25 }}>
                  {actions}
                  {allowFiles && (
                    <Tooltip title={t('c3.chat.attach')}>
                      <IconButton
                        size="small"
                        aria-label={t('c3.chat.attach')}
                        onClick={() => fileRef.current?.click()}
                        disabled={disabled}
                      >
                        <Paperclip2 size={20} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )
            }
          }}
        />
        <SoftIconButton
          tone={showStop ? 'neutral' : 'primary'}
          aria-label={showStop ? t('c3.chat.stop') : showMic ? t('c3.chat.record') : t('c3.chat.send')}
          onClick={showStop ? onStop : showMic ? () => void recorder.start() : send}
          disabled={showStop ? false : showMic ? disabled : !canSend}
          sx={(theme) => ({
            width: 42,
            height: 42,
            flexShrink: 0,
            '& svg': { transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }
          })}
        >
          {showStop ? (
            <Stop size={20} variant="Bold" />
          ) : showMic ? (
            <Microphone2 size={20} variant="Bold" />
          ) : (
            <Send2 size={20} variant="Bold" />
          )}
        </SoftIconButton>
      </Stack>
      {allowFiles && <input ref={fileRef} type="file" multiple hidden accept={accept} onChange={pick} aria-hidden tabIndex={-1} />}
    </Box>
  );
}
