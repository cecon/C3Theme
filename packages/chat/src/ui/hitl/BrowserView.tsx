import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Danger, Monitor } from 'iconsax-reactjs';

import { clampPoint, safeFrame, type PagePoint } from '../../core/hitlBrowser';
import { useChatText } from '../text';
import BrowserBar from './BrowserBar';

export interface BrowserViewProps {
  url: string;
  title?: string;
  /** Captura da página (https ou data:image). O chat não abre a página: quem navega é o agente. */
  frame?: string;
  /** Padrão: `ready`. */
  status?: 'loading' | 'ready' | 'error';
  /** Texto do erro, no lugar do padrão. */
  error?: string;
  /** Quem está no controle. Sem isso, a faixa de controle não aparece. */
  control?: 'agent' | 'user';
  /** O que o agente está fazendo agora ("Clicando em Enviar"), sobre a captura. */
  activity?: string;
  /** Onde o agente vai clicar (em % da página). */
  target?: PagePoint;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  /** Ir para outro endereço. Só com o humano no controle (ou sem `control`). */
  onNavigate?: (url: string) => void;
  onTakeOver?: () => void;
  onHandBack?: () => void;
  /** Proporção da área da página. Padrão: 16 / 10. */
  aspectRatio?: string;
  /** Embaixo da página (botões de decisão do card). */
  footer?: ReactNode;
}

/**
 * Navegador interno do assistente: barra com voltar, avançar, recarregar e o endereço (domínio em destaque e o
 * cadeado), a captura do que o agente vê, onde ele vai clicar, carregando e erro, e quem está no controle com
 * "Assumir controle" / "Devolver ao assistente".
 */
export default function BrowserView(props: BrowserViewProps) {
  const t = useChatText();
  const { status = 'ready', control } = props;
  const frame = safeFrame(props.frame);
  const target = clampPoint(props.target);
  const userDrives = control !== 'agent';

  return (
    <Box
      role="region"
      aria-label={t('c3.chat.browser.label')}
      sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}
    >
      <BrowserBar
        url={props.url}
        canGoBack={props.canGoBack}
        canGoForward={props.canGoForward}
        onBack={userDrives ? props.onBack : undefined}
        onForward={userDrives ? props.onForward : undefined}
        onReload={userDrives ? props.onReload : undefined}
        onNavigate={userDrives ? props.onNavigate : undefined}
      />
      <Box sx={{ position: 'relative', height: 2 }}>
        {status === 'loading' && <LinearProgress aria-label={t('c3.chat.browser.loading')} sx={{ height: 2 }} />}
      </Box>
      <Box sx={{ position: 'relative', aspectRatio: props.aspectRatio ?? '16 / 10', bgcolor: 'action.hover' }}>
        {status === 'error' ? (
          <Empty icon={<Danger size={28} />} text={props.error ?? t('c3.chat.browser.error')} />
        ) : frame ? (
          <Box
            component="img"
            src={frame}
            alt={props.title ?? props.url}
            sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          <Empty icon={<Monitor size={28} />} text={status === 'loading' ? t('c3.chat.browser.loading') : t('c3.chat.browser.noFrame')} />
        )}
        {target && status !== 'error' && (
          <Box
            role="img"
            aria-label={t('c3.chat.browser.target')}
            sx={{
              position: 'absolute',
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: 44,
              height: 44,
              ml: '-22px',
              mt: '-22px',
              borderRadius: '50%',
              border: '2.5px solid',
              borderColor: 'primary.main',
              // anel claro por fora: aparece sobre fundo escuro e claro sem cobrir o que está embaixo
              boxShadow: (th) => `0 0 0 2px ${th.palette.background.paper}`,
              pointerEvents: 'none'
            }}
          />
        )}
        {props.activity && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 8,
              bottom: 8,
              maxWidth: 'calc(100% - 16px)',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'background.paper',
              boxShadow: 1
            }}
            noWrap
          >
            {props.activity}
          </Typography>
        )}
      </Box>
      {control && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.5, py: 0.75, borderTop: 1, borderColor: 'divider' }}>
          <Box
            aria-hidden
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: control === 'agent' ? 'primary.main' : 'success.main' }}
          />
          <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }} role="status">
            {t(control === 'agent' ? 'c3.chat.browser.agent' : 'c3.chat.browser.user')}
          </Typography>
          {control === 'agent' && props.onTakeOver && (
            <Button size="small" variant="outlined" onClick={props.onTakeOver}>
              {t('c3.chat.browser.takeOver')}
            </Button>
          )}
          {control === 'user' && props.onHandBack && (
            <Button size="small" onClick={props.onHandBack}>
              {t('c3.chat.browser.handBack')}
            </Button>
          )}
        </Stack>
      )}
      {props.footer && <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>{props.footer}</Box>}
    </Box>
  );
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Stack
      spacing={1}
      sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: 'text.secondary', p: 2 }}
    >
      {icon}
      <Typography variant="body2" sx={{ color: 'inherit', textAlign: 'center' }}>
        {text}
      </Typography>
    </Stack>
  );
}
