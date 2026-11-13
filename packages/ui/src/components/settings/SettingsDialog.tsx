import { ReactNode, useEffect, useId, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';

import { useUiText } from '../../i18n';
import { ConteudoDoStatus, Footer, Header } from './SettingsDialogParts';
import SettingsNav, { SettingsSection } from './SettingsNav';
import SettingsSearchBox from './SettingsSearchBox';
import type { SettingsSearchEntry, SettingsSearchHit } from './search';

/** Estado do conteúdo do painel: o carregando/erro/sem permissão fica no lugar dos ajustes, nunca solto na tela. */
export type SettingsDialogStatus = 'pronto' | 'carregando' | 'erro' | 'sem-permissao';

/** O que a caixa de busca faz; o diálogo guarda o texto para o Escape limpar antes de fechar. */
export interface SettingsDialogSearch {
  entries: readonly SettingsSearchEntry[];
  value: string;
  onChange: (value: string) => void;
  onPick: (hit: SettingsSearchHit) => void;
  placeholder?: string;
  emptyLabel?: string;
}

export interface SettingsDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** fecha depois de resolver alterações pendentes e a política de fundo */
  onClose: () => void;
  /** clique no fundo fecha? O padrão é fechar; a spec pode desligar */
  closeOnBackdrop?: boolean;
  /** abas (pessoal) ou seções (servidor), na ordem em que aparecem */
  sections: readonly SettingsSection[];
  section: string;
  onSectionChange: (id: string) => void;
  /** busca por linha de todas as abas/seções; sem ela, o diálogo não mostra a caixa */
  search?: SettingsDialogSearch;
  status?: SettingsDialogStatus;
  /** texto do erro ou da falta de permissão */
  statusMessage?: string;
  /** como conceder a permissão que falta */
  statusComoConceder?: string;
  onRetry?: () => void;
  saving?: boolean;
  saved?: boolean;
  /** alterações ainda não salvas: o fechamento pede confirmação */
  pendingChanges?: boolean;
  /** textos da confirmação de fechamento */
  confirmClose?: { title?: string; description?: string; confirmLabel?: string; cancelLabel?: string };
  /** conteúdo extra do rodapé, à esquerda (ex.: entrada das configurações do servidor) */
  footer?: ReactNode;
  /** versão do sistema, à direita do rodapé */
  version?: string;
  /** rótulo da navegação lateral */
  navLabel?: string;
  children: ReactNode;
}

/**
 * Moldura do modal de configurações (#119): diálogo sobre a casca com fundo inerte, título e descrição associados,
 * navegação lateral por abas/seções, busca por linha, painel que rola por dentro, rodapé e estados. Fecha pelo
 * botão, por Escape (que antes limpa a busca) e, conforme a política, por clique no fundo; com alterações pendentes,
 * pede confirmação antes de fechar. O foco entra no diálogo ao abrir e volta para quem abriu ao fechar (o Dialog do
 * MUI prende o foco e devolve o anterior).
 */
export default function SettingsDialog({
  open,
  title,
  description,
  onClose,
  closeOnBackdrop = true,
  sections,
  section,
  onSectionChange,
  search,
  status = 'pronto',
  statusMessage,
  statusComoConceder,
  onRetry,
  saving = false,
  saved = false,
  pendingChanges = false,
  confirmClose,
  footer,
  version,
  navLabel,
  children
}: SettingsDialogProps) {
  const t = useUiText();
  const titleId = useId();
  const descriptionId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [confirmandoFechar, setConfirmandoFechar] = useState(false);

  const requestClose = () => {
    if (pendingChanges) {
      setConfirmandoFechar(true);
      return;
    }
    onClose();
  };

  // o foco entra no diálogo: a busca quando existe, senão a seção aberta, senão o primeiro controle
  useEffect(() => {
    if (!open) {
      setConfirmandoFechar(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const alvo =
        searchInput.current ??
        body.current?.querySelector<HTMLElement>('[data-settings-nav] [aria-current="page"], [data-settings-panel] button, button') ??
        null;
      alvo?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const mostrarConfirmacao = confirmandoFechar && pendingChanges;

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' && !closeOnBackdrop) return;
        requestClose();
      }}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      slotProps={{ paper: { sx: { height: 'min(720px, calc(100% - 48px))', bgcolor: 'background.default' } } }}
    >
      <Box
        ref={body}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          if (mostrarConfirmacao) {
            setConfirmandoFechar(false);
            return;
          }
          if (search !== undefined && search.value !== '') {
            search.onChange('');
            return;
          }
          requestClose();
        }}
        sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
      >
        <Header
          titleId={titleId}
          descriptionId={descriptionId}
          title={mostrarConfirmacao ? (confirmClose?.title ?? t('c3.settingsModal.closeConfirmTitle')) : title}
          description={mostrarConfirmacao ? (confirmClose?.description ?? t('c3.settingsModal.closeConfirmDescription')) : description}
          onRequestClose={requestClose}
        />

        {mostrarConfirmacao ? (
          <Stack sx={{ p: 3, gap: 2, alignItems: 'flex-start' }}>
            <Button variant="contained" color="error" onClick={onClose}>
              {confirmClose?.confirmLabel ?? t('c3.settingsModal.closeConfirm')}
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setConfirmandoFechar(false)} autoFocus>
              {confirmClose?.cancelLabel ?? t('c3.settingsModal.keepEditing')}
            </Button>
          </Stack>
        ) : (
          <>
            {search !== undefined && (
              <SettingsSearchBox
                entries={search.entries}
                value={search.value}
                onChange={search.onChange}
                onPick={search.onPick}
                inputRef={searchInput}
                {...(search.placeholder === undefined ? {} : { placeholder: search.placeholder })}
                {...(search.emptyLabel === undefined ? {} : { emptyLabel: search.emptyLabel })}
              />
            )}
            <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
              {sections.length > 1 && (
                <SettingsNav
                  sections={[...sections]}
                  value={section}
                  onChange={onSectionChange}
                  label={navLabel ?? t('c3.settingsModal.sections')}
                />
              )}
              <Box data-settings-panel sx={{ flex: 1, minWidth: 0, overflowY: 'auto', p: 2.5 }}>
                <Stack sx={{ gap: 2.5, maxWidth: 680, mx: 'auto' }}>
                  <ConteudoDoStatus status={status} mensagem={statusMessage} comoConceder={statusComoConceder} onRetry={onRetry} />
                  {status === 'pronto' && children}
                </Stack>
              </Box>
            </Stack>
          </>
        )}

        <Footer footer={footer} version={version} saving={saving} saved={saved} />
      </Box>
    </Dialog>
  );
}
