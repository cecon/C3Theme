// Um estado declarado de uma tela (`$defs/states`, ADR 0010) desenhado do jeito da shell: o mesmo para página, painel e
// chat. Estado que a spec não declarou não desenha nada; quem chama decide o padrão.

import { useIntl } from 'react-intl';
import { Link as RouterLink } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Danger, Lock } from 'iconsax-reactjs';

import { EmptyState, PanelSkeleton } from '@c3theme/ui';
import { iconByName, useEngine, useText } from '../context';
import type { LinkDef } from '../types';
import type { StateKey, StatesDef } from './states';

export interface StateViewProps {
  states: StatesDef;
  state: StateKey;
  /** "Tentar de novo" do erro; sem ele, o erro fica só com a mensagem. */
  onRetry?: () => void;
  /** Menos espaço em volta: painel lateral, cartão, chat. */
  dense?: boolean;
}

export default function StateView({ states, state, onRetry, dense }: StateViewProps) {
  const text = useText();
  const intl = useIntl();
  if (state === 'loading' && states.loading) {
    const loading = text(states.loading.text);
    // o esqueleto anuncia o texto ao leitor de tela; o texto visível não repete
    return (
      <Stack spacing={2}>
        <Typography aria-hidden="true" variant="body2" color="text.secondary">
          {loading}
        </Typography>
        <PanelSkeleton delay={0} label={loading} />
      </Stack>
    );
  }
  if (state === 'empty' && states.empty)
    return (
      <EmptyState dense={dense} title={text(states.empty.text)} action={states.empty.action && <LinkButton link={states.empty.action} />} />
    );
  if (state === 'error' && states.error) {
    const retry = text(states.error.retry, intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' }));
    return (
      <EmptyState
        dense={dense}
        icon={<Danger size={dense ? 22 : 28} />}
        title={<span role="alert">{text(states.error.text)}</span>}
        action={
          onRetry && (
            <Button variant="contained" onClick={onRetry}>
              {retry}
            </Button>
          )
        }
      />
    );
  }
  if (state === 'forbidden' && states.forbidden)
    return (
      <EmptyState
        dense={dense}
        icon={<Lock size={dense ? 22 : 28} />}
        title={text(states.forbidden.text)}
        description={states.forbidden.howTo && text(states.forbidden.howTo)}
        action={states.forbidden.action && <LinkButton link={states.forbidden.action} />}
      />
    );
  if (state === 'offline' && states.offline) return <OfflineNotice offline={states.offline} />;
  return null;
}

/** Sem conexão: aviso no alto, e a tela continua com o que já carregou embaixo. */
function OfflineNotice({ offline }: { offline: NonNullable<StatesDef['offline']> }) {
  const text = useText();
  const intl = useIntl();
  const keeps = offline.keeps ?? [];
  return (
    <Alert severity="warning" role="status" sx={{ mb: 2 }}>
      {text(offline.text)}
      {keeps.length > 0 && (
        <>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {intl.formatMessage({ id: 'c3.states.keeps', defaultMessage: 'Continua funcionando:' })}
          </Typography>
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            {keeps.map((k, i) => (
              <li key={i}>{text(k)}</li>
            ))}
          </ul>
        </>
      )}
    </Alert>
  );
}

/** Próximo passo declarado: rota do app (`path`) ou endereço de fora (`href`, em outra aba). */
function LinkButton({ link }: { link: LinkDef }) {
  const text = useText();
  const Icon = iconByName(link.icon, useEngine().icons);
  const label = text(link.label);
  const startIcon = Icon ? <Icon size={18} /> : undefined;
  if (link.path)
    return (
      <Button variant="contained" component={RouterLink} to={link.path} startIcon={startIcon}>
        {label}
      </Button>
    );
  return (
    <Button variant="contained" href={link.href ?? ''} target="_blank" rel="noopener noreferrer" startIcon={startIcon}>
      {label}
    </Button>
  );
}
