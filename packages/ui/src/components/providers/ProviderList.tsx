import { useEffect, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// third-party
import { Refresh2 } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { visuallyHidden } from '../../theme/visuallyHidden';
import { changesBetween } from './providerState';
import { ProviderRow } from './ProviderRow';
import type { ProviderActions, ProviderItem } from './types';

export interface ProviderListProps extends ProviderActions {
  providers: ProviderItem[];
  /** "Procurar de novo" no rodapé; sem callback o rodapé não aparece. */
  onRefresh?: () => void;
  /** A busca está rodando: o botão do rodapé gira e fica desabilitado. */
  refreshing?: boolean;
  /** Nome acessível da lista (ex.: "Programas de IA"). */
  label?: string;
}

/**
 * Lista de provedores (programas de IA do computador) com o estado de cada um e as ações para instalar, entrar,
 * tentar de novo, atualizar e remover. Só mostra e repassa: quem baixa, abre o login e procura é o app.
 */
export default function ProviderList({ providers, onRefresh, refreshing = false, label, ...actions }: ProviderListProps) {
  const t = useUiText();
  const announce = useAnnouncement(providers);

  return (
    <Paper variant="outlined" sx={{ position: 'relative' }}>
      {providers.length === 0 ? (
        <Typography color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
          {t('c3.providers.empty')}
        </Typography>
      ) : (
        <Box
          component="ul"
          aria-label={label}
          sx={{ listStyle: 'none', m: 0, p: 0, '& > li + li': { borderTop: 1, borderColor: 'divider' } }}
        >
          {providers.map((item) => (
            <ProviderRow key={item.id} item={item} actions={actions} />
          ))}
        </Box>
      )}
      <Box role="status" sx={visuallyHidden}>
        {announce}
      </Box>
      {onRefresh && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              size="small"
              onClick={onRefresh}
              disabled={refreshing}
              startIcon={refreshing ? <CircularProgress size={16} color="inherit" aria-hidden /> : <Refresh2 size={18} />}
            >
              {t('c3.providers.refresh')}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}

/** Texto da região viva: troca de estado ("Codex: Pronto") e progresso de 25 em 25%. */
function useAnnouncement(providers: ProviderItem[]) {
  const t = useUiText();
  const prev = useRef(providers);
  const [text, setText] = useState('');
  useEffect(() => {
    const changes = changesBetween(prev.current, providers);
    prev.current = providers;
    if (changes.length === 0) return;
    const parts = changes.map((c) => {
      const { name, status, error } = c.item;
      if (c.kind === 'progress') return t('c3.providers.progress', { name, percent: c.percent });
      const said = t('c3.providers.announce', { name, status: t(`c3.providers.status.${status}`) });
      return status === 'error' && error ? `${said}. ${error}` : said;
    });
    setText(parts.join('. '));
  }, [providers, t]);
  return text;
}
