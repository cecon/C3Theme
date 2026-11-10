import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Add, ArrowUp, DocumentText, Paperclip2 } from 'iconsax-reactjs';

import type useMessageQueue from '../hooks/useMessageQueue';
import { useBytesFormat } from './format';
import QueuedMessages from './QueuedMessages';
import useAttachments from '../hooks/useAttachments';
import DropHint from './DropHint';
import { useChatText } from './text';

export interface AddMenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
}

export interface AgentComposerProps {
  /** Texto controlado (ligue no `useDraft`). */
  value: string;
  onChange: (text: string) => void;
  /** Enviar. O app limpa o texto depois; os arquivos o componente limpa. */
  onSend: (text: string, files: File[]) => void;
  /** Assistente respondendo: o botão vira Parar (com `onStop`) e o Enter põe na fila (com `queue`). */
  busy?: boolean;
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
}

/**
 * Caixa de mensagem do modo assistente, no jeito dos agentes de IA: a fila acima, o texto em cima e uma barra
 * embaixo com +, os seletores que o app passar e o botão redondo de enviar/parar; a linha de status por último.
 * Enter envia (ou põe na fila enquanto responde), Shift+Enter quebra a linha, Esc para a resposta.
 */
export default function AgentComposer(props: AgentComposerProps) {
  const { value, onChange, onSend, busy, onStop, queue, files: allowFiles = true, accept, addItems = [] } = props;
  const t = useChatText();
  const bytes = useBytesFormat();
  const { files, setFiles, dragging, rootRef, pick, paste } = useAttachments({
    enabled: allowFiles,
    accept,
    disabled: props.disabled,
    dropTarget: props.dropTarget
  });
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    } else if (e.key === 'Escape' && busy && onStop) {
      e.preventDefault();
      onStop();
    }
  }

  const showAdd = allowFiles || addItems.length > 0;
  const showStop = busy && !!onStop && !hasContent;
  const sendLabel = busy ? t('c3.chat.queueSend') : t('c3.chat.send');
  return (
    <Box
      ref={rootRef}
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        ...(dragging && { outline: '2px dashed', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: 4 })
      }}
    >
      {dragging && <DropHint />}
      {queue && (
        <QueuedMessages items={queue.items} onUpdate={queue.update} onRemove={queue.remove} onSendNow={busy ? undefined : queue.sendNow} />
      )}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 4,
          containerType: 'inline-size', // os seletores encolhem pela largura da caixa, não da tela
          px: 1,
          pt: 1,
          pb: 0.75,
          bgcolor: 'background.paper',
          '&:focus-within': { borderColor: 'primary.main', boxShadow: (th) => `0 0 0 1px ${th.vars.palette.primary.main}` }
        }}
      >
        {files.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, px: 0.5, mb: 1 }}>
            {files.map((f) => (
              <Chip
                key={`${f.name}:${f.size}`}
                size="small"
                icon={<DocumentText size={14} />}
                label={`${f.name} · ${bytes(f.size)}`}
                onDelete={() => setFiles((list) => list.filter((l) => l !== f))}
                variant="outlined"
                sx={{ maxWidth: '100%' }}
              />
            ))}
          </Stack>
        )}
        <InputBase
          inputRef={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          onPaste={paste}
          placeholder={props.placeholder ?? t('c3.chat.assistantPlaceholder')}
          disabled={props.disabled}
          multiline
          minRows={2}
          maxRows={8}
          fullWidth
          inputProps={{ 'aria-label': t('c3.chat.message') }}
          sx={{ px: 1, typography: 'body2' }}
        />
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5, minWidth: 0 }}>
          {showAdd && (
            <Tooltip title={addItems.length ? t('c3.chat.add') : t('c3.chat.attach')}>
              <IconButton
                aria-label={addItems.length ? t('c3.chat.add') : t('c3.chat.attach')}
                aria-haspopup={addItems.length ? 'menu' : undefined}
                disabled={props.disabled}
                onClick={(e) => (addItems.length ? setMenu(e.currentTarget) : fileRef.current?.click())}
                sx={{ bgcolor: 'action.hover', width: 34, height: 34 }}
              >
                <Add size={20} />
              </IconButton>
            </Tooltip>
          )}
          <Stack direction="row" sx={{ alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
            {props.startActions}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" sx={{ alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
            {props.endActions}
          </Stack>
          <Tooltip title={showStop ? t('c3.chat.stop') : sendLabel}>
            <span>
              <IconButton
                aria-label={showStop ? t('c3.chat.stop') : sendLabel}
                onClick={showStop ? onStop : send}
                disabled={showStop ? false : !canSend}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                }}
              >
                {showStop ? (
                  <Box aria-hidden sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'currentColor' }} />
                ) : (
                  <ArrowUp size={18} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>
      {((busy && queue) || props.hint) && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ px: 1.5, mt: 0.5 }}>
          {busy && queue ? t('c3.chat.queueHint') : props.hint}
        </Typography>
      )}
      {props.status && <Box sx={{ mt: 1 }}>{props.status}</Box>}
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)} slotProps={{ list: { dense: true } }}>
        {allowFiles && (
          <MenuItem
            onClick={() => {
              setMenu(null);
              fileRef.current?.click();
            }}
          >
            <ListItemIcon>
              <Paperclip2 size={16} />
            </ListItemIcon>
            {t('c3.chat.attach')}
          </MenuItem>
        )}
        {addItems.map((it) => (
          <MenuItem
            key={it.id}
            onClick={() => {
              setMenu(null);
              it.onClick();
            }}
          >
            {it.icon && <ListItemIcon>{it.icon}</ListItemIcon>}
            {it.label}
          </MenuItem>
        ))}
      </Menu>
      {allowFiles && <input ref={fileRef} type="file" multiple hidden accept={accept} onChange={pick} aria-hidden tabIndex={-1} />}
    </Box>
  );
}
