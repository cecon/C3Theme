import { Component, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MessagePage } from '@c3theme/ui';
import { useText } from '../context';
import type { Text } from '../types';

/** Estado público da aplicação; não substitui autorização nem bloqueio de escrita no backend. */
export interface AppStatusDef {
  mode: 'maintenance' | 'comingSoon';
  title?: Text;
  message?: Text;
  until?: string;
}

export function AppStatus({ status }: { status: AppStatusDef }) {
  const intl = useIntl();
  const text = useText();
  const maintenance = status.mode === 'maintenance';
  return (
    <MessagePage
      fullScreen
      title={text(
        status.title,
        intl.formatMessage({
          id: maintenance ? 'c3.status.maintenance' : 'c3.status.comingSoon',
          defaultMessage: maintenance ? 'Em manutenção' : 'Em breve'
        })
      )}
      description={text(status.message)}
    >
      {status.until && (
        <Typography color="text.secondary">
          {intl.formatMessage(
            {
              id: maintenance ? 'c3.status.return' : 'c3.status.launch',
              defaultMessage: maintenance ? 'Previsão de retorno: {date}' : 'Lançamento: {date}'
            },
            {
              date: intl.formatDate(status.until, { dateStyle: 'long', timeStyle: 'short' })
            }
          )}
        </Typography>
      )}
    </MessagePage>
  );
}

/** Sem detalhes internos do erro na tela pública. */
export function ServerError() {
  const intl = useIntl();
  return (
    <MessagePage
      fullScreen
      code="500"
      title={intl.formatMessage({ id: 'c3.status.error', defaultMessage: 'Algo deu errado' })}
      description={intl.formatMessage({ id: 'c3.status.errorHelp', defaultMessage: 'Não foi possível abrir esta tela. Tente novamente.' })}
      action={
        <Button variant="contained" onClick={() => window.location.reload()}>
          {intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' })}
        </Button>
      }
    />
  );
}

export class ShellBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <ServerError /> : this.props.children;
  }
}
