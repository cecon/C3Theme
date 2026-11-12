// Um estado declarado na spec (`$defs/states`, issues #99 e #101): texto, como conceder, ação, o que continua funcionando e
// "Tentar de novo". Sem o estado declarado, não desenha nada.

import { Link as RouterLink } from 'react-router';
import { useIntl } from 'react-intl';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Lock, Warning2, WifiSquare } from 'iconsax-reactjs';

import { EmptyState } from '@c3theme/ui';

import { useText } from '../context';
import type { LinkDef } from '../types';
import type { StateKey, StatesDef } from './states';

export interface StateViewProps {
  states: StatesDef;
  state: StateKey;
  /** Botão "Tentar de novo" do estado de erro. Sem ele, não há botão. */
  onRetry?: () => void;
  /** Menos espaço em volta (painel lateral). */
  dense?: boolean;
  /** Faixa fina sobre o conteúdo que continua visível (erro e offline com dados já carregados). */
  banner?: boolean;
}

const ICONS: Partial<Record<StateKey, typeof Lock>> = { error: Warning2, forbidden: Lock, offline: WifiSquare };

function ActionButton({ link }: { link: LinkDef }) {
  const text = useText();
  const label = text(link.label);
  if (link.path)
    return (
      <Button variant="outlined" size="small" component={RouterLink} to={link.path}>
        {label}
      </Button>
    );
  return (
    <Button variant="outlined" size="small" href={link.href}>
      {label}
    </Button>
  );
}

export default function StateView({ states, state, onRetry, dense, banner }: StateViewProps) {
  const text = useText();
  const intl = useIntl();
  const def = states[state];
  if (!def) return null;
  const title = text(def.text);
  if (state === 'loading')
    return (
      <Stack role="status" sx={{ alignItems: 'center', gap: 1.5, py: dense ? 3 : 6, px: 2, textAlign: 'center' }}>
        <CircularProgress size={24} aria-hidden />
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Stack>
    );
  const howTo = 'howTo' in def && def.howTo !== undefined ? text(def.howTo) : undefined;
  const keeps = 'keeps' in def ? (def.keeps ?? []).map((k) => text(k)) : [];
  const link = 'action' in def ? def.action : undefined;
  const retry =
    state === 'error' && onRetry ? (
      <Button variant={banner ? 'text' : 'outlined'} color={banner ? 'inherit' : 'primary'} size="small" onClick={onRetry}>
        {'retry' in def && def.retry !== undefined
          ? text(def.retry)
          : intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' })}
      </Button>
    ) : undefined;
  const description =
    howTo || keeps.length > 0 ? (
      <>
        {howTo}
        {keeps.length > 0 && (
          <Stack component="ul" sx={{ m: 0, mt: howTo ? 1 : 0, pl: 2.5, textAlign: 'left' }}>
            {keeps.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </Stack>
        )}
      </>
    ) : undefined;
  const Icon = ICONS[state];
  const action = retry ?? (link && <ActionButton link={link} />);
  if (banner)
    return (
      <Alert
        severity={state === 'offline' ? 'warning' : state === 'error' ? 'error' : 'info'}
        icon={Icon && <Icon size={20} />}
        action={action}
        sx={{ borderRadius: 0 }}
      >
        {title}
        {description && (
          <Typography component="div" variant="body2" sx={{ mt: 0.5, opacity: 0.85 }}>
            {description}
          </Typography>
        )}
      </Alert>
    );
  return (
    <EmptyState dense={dense} icon={Icon && <Icon size={dense ? 22 : 28} />} title={title} description={description} action={action} />
  );
}
