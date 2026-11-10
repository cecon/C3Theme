// material-ui
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, Microphone2, MicrophoneSlash } from 'iconsax-reactjs';

import { useChatText } from '../text';
import type { VoiceCaption, VoiceState } from './types';
import VoiceOrb from './VoiceOrb';

export interface VoiceConversationProps {
  state: VoiceState;
  /** Volume de quem fala agora (0 a 1): o do microfone ao ouvir, o da resposta ao falar (`useAudioLevel`). */
  level?: number;
  /** A legenda ao vivo: as últimas falas (mostra a última de cada lado). */
  captions?: VoiceCaption[];
  muted?: boolean;
  onToggleMute?: () => void;
  /** Encerra e volta para o texto. */
  onEnd: () => void;
  /** Texto do erro (`state: 'error'`). */
  error?: string;
}

/**
 * Conversa por voz ao vivo, no jeito dos apps de assistente: a bola no meio pulsando com quem fala, o estado embaixo
 * (conectando, ouvindo, pensando, falando), a legenda da última fala e, no pé, microfone e encerrar. Ocupa a altura do
 * pai. O áudio é do app (provedor de tempo real): o componente só desenha o estado que ele passa.
 */
export default function VoiceConversation(props: VoiceConversationProps) {
  const { state, level, captions = [], muted, onToggleMute, onEnd } = props;
  const t = useChatText();
  const status =
    state === 'error'
      ? (props.error ?? t('c3.chat.voiceError'))
      : muted && state === 'listening'
        ? t('c3.chat.voiceMuted')
        : t(`c3.chat.voice.${state}`);
  const last = captions.at(-1);
  const mic = muted ? t('c3.chat.voiceUnmute') : t('c3.chat.voiceMute');
  return (
    <Stack sx={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'space-between', p: 3, gap: 2 }}>
      <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 0 }}>
        <VoiceOrb state={state} level={muted && state === 'listening' ? 0 : level} />
        <Typography role="status" aria-live="polite" color={state === 'error' ? 'error' : 'text.secondary'}>
          {status}
        </Typography>
        {last && (
          <Typography
            aria-live="polite"
            color={last.who === 'user' ? 'text.secondary' : 'text.primary'}
            sx={{
              textAlign: 'center',
              maxWidth: 420,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {last.text}
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
        {onToggleMute && (
          <Tooltip title={mic}>
            <IconButton
              aria-label={mic}
              aria-pressed={!!muted}
              onClick={onToggleMute}
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: muted ? 'error.lighter' : 'action.hover',
                color: muted ? 'error.main' : 'text.primary'
              }}
            >
              {muted ? <MicrophoneSlash size={24} /> : <Microphone2 size={24} />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={t('c3.chat.voiceEnd')}>
          <IconButton
            aria-label={t('c3.chat.voiceEnd')}
            onClick={onEnd}
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'error.main',
              color: 'error.contrastText',
              '&:hover': { bgcolor: 'error.dark' }
            }}
          >
            <CloseCircle size={24} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
