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
import type { LinkDef, Text } from '../types';
import type { StateKey, StatesDef } from './states';

export interface StateViewProps {
  /** Ausente: não desenha nada. */
  states?: StatesDef;
  state: StateKey;
  /** Botão "Tentar de novo" do estado de erro. Sem ele, não há botão. */
  onRetry?: () => void;
  /** Menos espaço em volta (painel lateral). */
  dense?: boolean;
  /** Faixa fina sobre o conteúdo que continua visível (erro e offline com dados já carregados). */
  banner?: boolean;
}

const ICONS: Partial<Record<StateKey, typeof Lock>> = { error: Warning2, forbidden: Lock, offline: WifiSquare };
/** Cor da faixa: offline avisa, erro é erro, o resto informa. */
const SEVERITY: Partial<Record<StateKey, 'warning' | 'error'>> = { offline: 'warning', error: 'error' };
// estilos fora do componente: valem para todo estado
const LOADING_SX = { alignItems: 'center', gap: 1.5, px: 2, textAlign: 'center' } as const;
const KEEPS_SX = { m: 0, pl: 2.5, textAlign: 'left' } as const;
const BANNER_SX = { borderRadius: 0 } as const;
const BANNER_TEXT_SX = { mt: 0.5, opacity: 0.85 } as const;

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

/** Texto de apoio: como conceder e a lista do que continua funcionando. */
function Details({ howTo, keeps }: { howTo?: string; keeps: string[] }) {
  if (!howTo && keeps.length === 0) return null;
  return (
    <>
      {howTo}
      {keeps.length > 0 && (
        <Stack component="ul" sx={[KEEPS_SX, { mt: howTo ? 1 : 0 }]}>
          {keeps.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </Stack>
      )}
    </>
  );
}

export default function StateView({ states, state, onRetry, dense, banner }: StateViewProps) {
  const text = useText();
  const intl = useIntl();
  const def = states?.[state];
  if (!def) return null;
  const title = text(def.text);
  if (state === 'loading')
    return (
      <Stack role="status" sx={[LOADING_SX, { py: dense ? 3 : 6 }]}>
        <CircularProgress size={24} aria-hidden />
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Stack>
    );
  const { howTo, keeps = [], action: link, retry: label } = def as { howTo?: Text; keeps?: Text[]; action?: LinkDef; retry?: Text };
  const details = <Details howTo={howTo === undefined ? undefined : text(howTo)} keeps={keeps.map((k) => text(k))} />;
  const retry = state === 'error' && onRetry && (
    <Button variant={banner ? 'text' : 'outlined'} color={banner ? 'inherit' : 'primary'} size="small" onClick={onRetry}>
      {text(label, intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' }))}
    </Button>
  );
  const action = retry || (link && <ActionButton link={link} />);
  const Icon = ICONS[state];
  if (banner)
    return (
      <Alert severity={SEVERITY[state] ?? 'info'} icon={Icon && <Icon size={20} />} action={action} sx={BANNER_SX}>
        {title}
        <Typography component="div" variant="body2" sx={BANNER_TEXT_SX}>
          {details}
        </Typography>
      </Alert>
    );
  return <EmptyState dense={dense} icon={Icon && <Icon size={dense ? 22 : 28} />} title={title} description={details} action={action} />;
}
