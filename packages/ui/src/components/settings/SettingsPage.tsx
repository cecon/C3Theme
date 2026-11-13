import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowLeft2 } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';

/** Um ponto da trilha da subpágina: a seção, a página, a subpágina... */
export interface SettingsPageTrailItem {
  label: string;
  /** pontos anteriores são clicáveis; o último é o lugar onde a pessoa está */
  onClick?: () => void;
}

export interface SettingsPageProps {
  trail: readonly SettingsPageTrailItem[];
  /** volta ao ponto anterior; quem abre a subpágina devolve o foco ao elemento que abriu */
  onBack: () => void;
  backLabel?: string;
  children: ReactNode;
}

/**
 * Painel de uma subpágina das configurações (#119): trilha com o nome da seção e um Voltar. A pessoa não fica
 * perdida dentro de um provedor, de uma importação ou de um papel: os pontos anteriores da trilha também levam de volta.
 */
export default function SettingsPage({ trail, onBack, backLabel, children }: SettingsPageProps) {
  const t = useUiText();
  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          color="secondary"
          variant="outlined"
          startIcon={<ArrowLeft2 size={16} />}
          onClick={onBack}
          aria-label={backLabel ?? t('c3.settingsModal.back')}
        >
          {backLabel ?? t('c3.settingsModal.back')}
        </Button>
        <Breadcrumbs aria-label={t('c3.settingsModal.back')} sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}>
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return last ? (
              <Typography key={`${item.label}:${index}`} variant="body2" color="text.primary" aria-current="page">
                {item.label}
              </Typography>
            ) : (
              <Link
                key={`${item.label}:${index}`}
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                color="inherit"
                onClick={item.onClick}
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Stack>
      <Box>{children}</Box>
    </Stack>
  );
}
