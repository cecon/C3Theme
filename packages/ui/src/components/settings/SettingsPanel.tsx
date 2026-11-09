import { ReactNode, useId } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

// third-party
import { CloseCircle } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { SYSTEM_FONT_STACK } from './context';
import SettingsNav, { SettingsSection } from './SettingsNav';

export interface SettingsPanelProps {
  title: string;
  /** `dialog` (padrão): modal sobre a janela. `window`: ocupa o contêiner, para uma janela própria do app desktop */
  variant?: 'dialog' | 'window';
  /** só no `dialog` */
  open?: boolean;
  /** mostra o botão de fechar; no `dialog` também fecha com Esc e clique fora */
  onClose?: () => void;
  /** seções de nível alto (Geral, Agentes...); com duas ou mais aparece a navegação à esquerda */
  sections?: SettingsSection[];
  section?: string;
  onSectionChange?: (id: string) => void;
  /** fonte do sistema no lugar da fonte do tema (app desktop no Mac) */
  systemFont?: boolean;
  /** grupos (SettingsGroup) da seção atual */
  children: ReactNode;
}

/**
 * Tela de ajustes de app desktop: título, fechar, navegação opcional por seções e os grupos. Sem botão de salvar:
 * cada controle vale na hora, como nos Ajustes do macOS e nas Configurações do Windows 11.
 */
export default function SettingsPanel(props: SettingsPanelProps) {
  const { variant = 'dialog', open = false, onClose, systemFont, sections = [] } = props;
  const titleId = useId();
  const font: SxProps<Theme> = systemFont ? { '&, & *': { fontFamily: SYSTEM_FONT_STACK } } : {};
  const body = <SettingsBody {...props} titleId={titleId} hasNav={sections.length > 1} />;
  if (variant === 'window') {
    return (
      <Box role="region" aria-labelledby={titleId} sx={[{ height: '100%', bgcolor: 'background.default' }, font]}>
        {body}
      </Box>
    );
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={sections.length > 1 ? 'md' : 'sm'}
      fullWidth
      aria-labelledby={titleId}
      slotProps={{ paper: { sx: [{ height: 'min(640px, calc(100% - 64px))', bgcolor: 'background.default' }, font] } }}
    >
      {body}
    </Dialog>
  );
}

function SettingsBody({
  title,
  onClose,
  sections = [],
  section,
  onSectionChange,
  children,
  titleId,
  hasNav
}: SettingsPanelProps & { titleId: string; hasNav: boolean }) {
  const t = useUiText();
  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
        <Typography id={titleId} component="h2" variant="h5" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {onClose && (
          <IconButton size="small" color="secondary" onClick={onClose} aria-label={t('c3.close')}>
            <CloseCircle size={20} />
          </IconButton>
        )}
      </Stack>
      <Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
        {hasNav && (
          <SettingsNav
            sections={sections}
            value={section ?? sections[0].id}
            onChange={(id) => onSectionChange?.(id)}
            label={t('c3.settingsPanel.sections')}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0, overflowY: 'auto', p: 2.5 }}>
          <Stack sx={{ gap: 2.5, maxWidth: 680, mx: 'auto' }}>{children}</Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
