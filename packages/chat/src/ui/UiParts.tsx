import type { ComponentType } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Magicpen } from 'iconsax-reactjs';

import type { Message } from '../core/types';
import { isPartOpen, type UiAnswer, type UiPart } from '../core/ui';
import { useChatText } from './text';

/** O que o renderizador de um `kind` recebe. */
export interface UiPartProps {
  part: UiPart;
  message: Message;
  /** Ainda aceita resposta (pendente e no prazo). Fechada, a parte mostra só o resumo. */
  open: boolean;
  /** Responde a parte; devolve se o servidor aceitou. Sem isso, a parte só mostra. */
  onAnswer?: (answer: UiAnswer) => Promise<boolean>;
}

/** Catálogo de renderizadores do app: `kind` → componente. Só o que está aqui aparece. */
export type UiRenderers = Record<string, ComponentType<UiPartProps>>;

export interface UiPartsProps {
  message: Message;
  renderers?: UiRenderers;
  onAnswer?: (message: Message, partId: string, answer: UiAnswer) => Promise<boolean>;
}

/** Por que a parte fechou sem resposta do usuário, para o cabeçalho do card. */
function closedNote(part: UiPart, open: boolean) {
  const state = part.state ?? 'pending';
  if (state === 'expired' || (state === 'pending' && !open)) return 'c3.chat.uiExpired';
  if (state !== 'cancelled') return undefined;
  if (part.reason === 'superseded') return 'c3.chat.uiSuperseded';
  if (part.reason === 'agent') return 'c3.chat.uiCancelledByAgent';
  return undefined;
}

/**
 * As partes de interface de uma resposta do assistente, cada uma num card marcado "Pedido pelo assistente" (para
 * nunca se confundir com uma tela do sistema). `kind` sem renderizador vira um aviso, nunca uma tela quebrada.
 */
export default function UiParts({ message, renderers = {}, onAnswer }: UiPartsProps) {
  const t = useChatText();
  if (!message.ui?.length) return null;
  return (
    <Stack spacing={1.5} sx={{ width: '100%' }}>
      {message.ui.map((part) => {
        const Renderer = Object.hasOwn(renderers, part.kind) ? renderers[part.kind] : undefined;
        const open = isPartOpen(part);
        const note = closedNote(part, open);
        return (
          <Paper
            key={part.id}
            variant="outlined"
            role="group"
            aria-label={t('c3.chat.uiOrigin')}
            sx={{ width: '100%', p: 2, borderRadius: 3, bgcolor: open ? 'background.paper' : 'transparent' }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary', mb: 1.25 }}>
              <Magicpen size={14} aria-hidden />
              <Typography variant="caption" sx={{ color: 'inherit' }}>
                {t('c3.chat.uiOrigin')}
                {note && ` · ${t(note)}`}
              </Typography>
            </Stack>
            {Renderer ? (
              <Renderer part={part} message={message} open={open} onAnswer={onAnswer && ((a) => onAnswer(message, part.id, a))} />
            ) : (
              <Alert severity="info" variant="outlined">
                {t('c3.chat.uiUnsupported')}
              </Alert>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}
