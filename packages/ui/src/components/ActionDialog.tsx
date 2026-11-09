import { FormEvent, ReactNode } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Maximize4, Minus } from 'iconsax-reactjs';

import { useUiText } from '../i18n';
import type { Tone } from '../theme/soft';

export interface ActionDialogProps {
  open: boolean;
  /** Nome da ação, ex.: "Cancelar venda". */
  title: ReactNode;
  /** O que a ação faz e o que desfaz. */
  description?: ReactNode;
  /** Pergunta de confirmação, mostrada em destaque antes dos campos. */
  confirm?: ReactNode;
  /** Texto do botão de confirmar. Padrão: o título. */
  confirmLabel?: ReactNode;
  /** Texto do botão que fecha sem fazer nada. Padrão "Voltar", para não confundir com uma ação chamada "Cancelar". */
  backLabel?: ReactNode;
  /** `danger` deixa o botão de confirmar vermelho: para o que não se desfaz. */
  tone?: Tone;
  /** Ação rodando: trava os botões e não fecha por clique fora ou Esc. */
  loading?: boolean;
  /** Erro geral (os erros por campo ficam nos campos). */
  error?: string;
  /** Há algo digitado: clique fora do diálogo não descarta. */
  dirty?: boolean;
  /** Campos pedidos antes de rodar. */
  children?: ReactNode;
  /** Largura máxima. Padrão 'sm'; 'md' para uma grade de linhas. */
  maxWidth?: 'sm' | 'md' | 'lg';
  /** Ocupa a tela inteira (grade grande: contagem de inventário). */
  fullScreen?: boolean;
  /** Com isso, o título ganha o botão que entra e sai da tela cheia. */
  onToggleFullScreen?: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const BUTTON_COLOR = {
  neutral: 'primary',
  primary: 'primary',
  secondary: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error'
} as const;

/**
 * Diálogo de confirmação de um comando (cancelar, reemitir, estornar), com campos opcionais.
 * Só apresenta: quem usa decide os campos, roda a ação e passa `loading` e `error`.
 */
export default function ActionDialog({
  open,
  title,
  description,
  confirm,
  confirmLabel,
  backLabel,
  tone = 'neutral',
  loading = false,
  error,
  dirty = false,
  children,
  maxWidth = 'sm',
  fullScreen = false,
  onToggleFullScreen,
  onConfirm,
  onClose
}: ActionDialogProps) {
  const t = useUiText();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    // o diálogo é portal no DOM, mas no React o submit sobe até o formulário de quem o abriu
    e.stopPropagation();
    if (!loading) onConfirm();
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      onClose={(_, reason) => {
        if (loading || (dirty && reason === 'backdropClick')) return;
        onClose();
      }}
    >
      {/* o form fica dentro do papel: o papel tem role="dialog", que não vale num <form> (axe aria-allowed-role) */}
      <Box
        component="form"
        onSubmit={submit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ flex: 1 }}>{title}</span>
          {onToggleFullScreen && (
            <Tooltip title={t(fullScreen ? 'c3.fullscreen.exit' : 'c3.fullscreen.enter')}>
              <IconButton
                size="small"
                onClick={onToggleFullScreen}
                aria-label={t(fullScreen ? 'c3.fullscreen.exit' : 'c3.fullscreen.enter')}
              >
                {fullScreen ? <Minus size={18} /> : <Maximize4 size={18} />}
              </IconButton>
            </Tooltip>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {description && <DialogContentText>{description}</DialogContentText>}
            {confirm && (
              <Alert severity={tone === 'danger' ? 'warning' : 'info'} variant="outlined">
                {confirm}
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={loading}>
            {backLabel ?? t('c3.action.back')}
          </Button>
          <Button type="submit" variant="contained" color={BUTTON_COLOR[tone]} loading={loading}>
            {confirmLabel ?? title}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
