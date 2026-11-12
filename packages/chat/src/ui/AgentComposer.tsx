import { useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';

// material-ui
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { composerKey, type SendKey } from '../core/steer';
import type { Message } from '../core/types';
import type useMessageQueue from '../hooks/useMessageQueue';
import QueuedMessages from './QueuedMessages';
import FileChips from './composer/FileChips';
import SteerHint from './steer/SteerHint';
import useAttachments from '../hooks/useAttachments';
import AddButton, { type AddMenuItem } from './composer/AddButton';
import IdleButton from './composer/IdleButton';
import MainButton, { type IdleAction } from './composer/MainButton';
import DropHint from './DropHint';
import { useChatText } from './text';

export type { AddMenuItem, IdleAction };

export interface AgentComposerProps {
  /** Texto controlado (ligue no `useDraft`). */
  value: string;
  onChange: (text: string) => void;
  /** Enviar. O app limpa o texto depois; os arquivos o componente limpa. */
  onSend: (text: string, files: File[]) => void;
  /** Assistente respondendo: o botão vira Parar (com `onStop`) e o Enter põe na fila (com `queue`). */
  busy?: boolean;
  /** Como envia: `enter` (padrão; Shift+Enter quebra a linha) ou `modEnter` (Ctrl+Enter, ⌘+Enter no Mac; Enter quebra). */
  sendKey?: SendKey;
  /**
   * Orientar o turno em andamento (ADR 0008): com o agente ocupado, Ctrl+Enter (⌘+Enter) manda o texto para dentro do
   * turno, sem interromper; com a caixa vazia, orienta com a primeira da fila. O atalho aparece junto da caixa e a fila
   * ganha Orientar. Sem isso, Ctrl+Enter só envia.
   */
  onSteer?: (text: string, files: File[]) => void;
  /** Orientações que o agente ainda não leu, na fila como "Orientando". */
  steering?: Message[];
  onRemoveSteering?: (id: string) => void;
  onStop?: () => void;
  /** A fila da próxima mensagem (`useMessageQueue`). Sem isso, não dá para enviar enquanto responde. */
  queue?: ReturnType<typeof useMessageQueue>;
  /** Anexar arquivos pelo botão +. Padrão: ligado. */
  files?: boolean;
  accept?: string;
  /** Onde soltar arquivos anexa (a área do chat, por exemplo). Padrão: a própria caixa. Colar imagem no texto também anexa. */
  dropTarget?: RefObject<HTMLElement | null>;
  /** Mais itens no menu do + (comandos, contexto). Sem eles, o + abre direto a escolha de arquivo. */
  addItems?: AddMenuItem[];
  /** Na barra, depois do +: o seletor de modo/permissão, por exemplo (`ComposerSelect`). */
  startActions?: ReactNode;
  /** Na barra, antes do enviar: modelo e esforço, por exemplo. */
  endActions?: ReactNode;
  /** Embaixo da caixa: a linha de status (`StatusLine`) ou o que o app quiser. */
  status?: ReactNode;
  /** Linha de ajuda embaixo da caixa, com o assistente parado. Respondendo, aparece a dica da fila. */
  hint?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /**
   * `inline`: uma linha só (46 px vazia), com o + à esquerda, o texto no meio e as ações e o botão principal à direita;
   * com várias linhas a caixa cresce para cima e os botões ficam embaixo. Cantos de 14 px, botões de 28 px, foco que só
   * clareia a borda e sem linha de ajuda. `split`: a caixa só com o texto numa linha e o enviar (ou o parar) dentro, e
   * embaixo, fora da caixa, a barra com o +, a voz (`idleAction`), os seletores e o resto (`endActions`), como nos
   * apps de agente de mesa. Padrão: `inline`. `stacked` mantém texto em cima e barra embaixo, dentro da caixa.
   */
  variant?: 'stacked' | 'inline' | 'split';
  /**
   * Conversa por voz (por exemplo). Em `inline`, ocupa o botão principal com a caixa vazia e o assistente parado (com
   * texto, vira enviar); em `split`, é um botão fixo na barra, ao lado do +.
   */
  idleAction?: IdleAction;
}

/**
 * Caixa de mensagem do modo assistente: a fila acima, texto e ações alinhados em uma linha;
 * cresce com o texto e mantém o botão de enviar/parar no rodapé. A linha de status vem por último.
 * Enter envia (ou põe na fila enquanto responde), Shift+Enter quebra a linha, Esc para a resposta; com
 * `sendKey="modEnter"`, Ctrl+Enter envia e Enter quebra. Com `onSteer`, Ctrl+Enter orienta enquanto responde.
 */
export default function AgentComposer(props: AgentComposerProps) {
  const { value, onChange, onSend, busy, onStop, queue, files: allowFiles = true, accept, addItems = [] } = props;
  const t = useChatText();
  const { files, setFiles, dragging, rootRef, pick, paste } = useAttachments({
    enabled: allowFiles,
    accept,
    disabled: props.disabled,
    dropTarget: props.dropTarget
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = value.trim().length > 0 || files.length > 0;
  const canSend = !props.disabled && hasContent && (!busy || !!queue);

  function send() {
    if (!canSend) return;
    if (busy) {
      queue!.enqueue(value, files);
      onChange('');
    } else onSend(value.trim(), files);
    setFiles([]);
    inputRef.current?.focus();
  }

  /** Orienta com o texto da caixa ou, vazia, com a primeira da fila. */
  function steer() {
    if (props.disabled) return;
    if (!hasContent) {
      queue?.steerNext();
      return;
    }
    props.onSteer!(value.trim(), files);
    onChange('');
    setFiles([]);
  }

  function onKey(e: KeyboardEvent) {
    const press = { key: e.key, shift: e.shiftKey, mod: e.ctrlKey || e.metaKey, composing: e.nativeEvent.isComposing };
    const sendKey = props.sendKey ?? 'enter';
    const intent = composerKey(press, { sendKey, busy: !!busy, canSteer: !!props.onSteer, canStop: !!onStop });
    if (intent === 'none') return;
    e.preventDefault();
    if (intent === 'send') send();
    else if (intent === 'steer') steer();
    else onStop!();
  }

  const split = props.variant === 'split';
  const inline = props.variant !== 'stacked'; // as duas: uma linha, cantos de 14 px, sem linha de ajuda
  const showAdd = allowFiles || addItems.length > 0;
  const showStop = busy && !!onStop && !hasContent;
  const idle = !split && !busy && !hasContent && !props.disabled && props.idleAction ? props.idleAction : undefined;
  const sendLabel = busy ? t('c3.chat.queueSend') : t('c3.chat.send');
  const add = showAdd && (
    <AddButton
      files={allowFiles}
      accept={accept}
      items={addItems}
      disabled={props.disabled}
      size={inline ? 28 : 34}
      onPick={pick}
      plain={split}
    />
  );
  const main = (
    <MainButton
      mode={showStop ? 'stop' : idle ? 'idle' : 'send'}
      label={showStop ? t('c3.chat.stop') : sendLabel}
      onClick={showStop ? onStop : send}
      disabled={showStop || idle ? false : !canSend}
      idle={idle}
      shape={split ? 'ghost' : inline ? 'circle' : 'square'}
    />
  );
  const input = (
    <InputBase
      inputRef={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKey}
      onPaste={paste}
      placeholder={props.placeholder ?? t('c3.chat.assistantPlaceholder')}
      disabled={props.disabled}
      multiline
      minRows={inline ? 1 : 2}
      maxRows={8}
      fullWidth
      inputProps={{ 'aria-label': t('c3.chat.message') }}
      sx={inline ? { px: 0.5, py: 0.5, typography: 'body2', flex: 1, minWidth: 0 } : { px: 1, typography: 'body2' }}
    />
  );
  const actions = (node: ReactNode) => (
    <Stack direction="row" spacing={inline ? 0.75 : 0} sx={{ alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
      {node}
    </Stack>
  );
  return (
    <Box
      ref={rootRef}
      sx={{
        ...(inline ? { p: 1 } : { px: { xs: 1.5, sm: 2 }, py: 1.5 }),
        ...(dragging && { outline: '2px dashed', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 4 })
      }}
    >
      {dragging && <DropHint />}
      {queue && (
        <QueuedMessages
          items={queue.items}
          onUpdate={queue.update}
          onRemove={queue.remove}
          onSendNow={busy ? undefined : queue.sendNow}
          onSteer={busy && queue.canSteer ? queue.steer : undefined}
          steering={props.steering}
          onRemoveSteering={props.onRemoveSteering}
        />
      )}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: inline ? '14px' : 4,
          containerType: 'inline-size', // os seletores encolhem pela largura da caixa, não da tela
          ...(inline ? { p: 1 } : { px: 1, pt: 1, pb: 0.75 }),
          bgcolor: 'background.paper',
          '&:focus-within': inline
            ? { borderColor: 'text.disabled' }
            : { borderColor: 'primary.main', boxShadow: (th) => `0 0 0 1px ${th.vars.palette.primary.main}` }
        }}
      >
        <FileChips files={files} onRemove={(f) => setFiles((list) => list.filter((l) => l !== f))} />
        {split ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-end', minWidth: 0, pl: 0.5 }}>
            {input}
            {main}
          </Stack>
        ) : inline ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-end', minWidth: 0 }}>
            {add}
            {input}
            {actions(props.startActions)}
            {actions(props.endActions)}
            {main}
          </Stack>
        ) : (
          <>
            {input}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5, minWidth: 0 }}>
              {add}
              {actions(props.startActions)}
              <Box sx={{ flex: 1 }} />
              {actions(props.endActions)}
              {main}
            </Stack>
          </>
        )}
      </Paper>
      {split && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.75, px: 0.5, minWidth: 0 }}>
          {add}
          {props.idleAction && <IdleButton action={props.idleAction} disabled={props.disabled} />}
          {actions(props.startActions)}
          <Box sx={{ flex: 1 }} />
          {actions(props.endActions)}
        </Stack>
      )}
      {busy && props.onSteer ? (
        <SteerHint />
      ) : (
        !inline &&
        ((busy && queue) || props.hint) && (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ px: 1.5, mt: 0.5 }}>
            {busy && queue ? t(props.sendKey === 'modEnter' ? 'c3.chat.queueHintButton' : 'c3.chat.queueHint') : props.hint}
          </Typography>
        )
      )}
      {props.status && <Box sx={{ mt: 1 }}>{props.status}</Box>}
    </Box>
  );
}
