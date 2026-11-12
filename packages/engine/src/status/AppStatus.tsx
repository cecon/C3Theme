// "Em manutenção", "Em breve" e o 500 da shell: telas do `status` do app.json (ou do 503 em /_meta/*), da página
// `comingSoon` e das falhas de renderização.

import { Component, useEffect, type ReactNode } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// third-party
import { Clock, Setting4 } from 'iconsax-reactjs';

import { Countdown, MessagePage, SoftAvatar } from '@c3theme/ui';
import { useText } from '../context';
import type { Text } from '../types';
import { untilTime } from './status';

/** Estado público da aplicação; não substitui autorização nem bloqueio de escrita no backend. */
export interface AppStatusDef {
  mode: 'maintenance' | 'comingSoon';
  title?: Text;
  message?: Text;
  until?: string;
}

export interface AppStatusProps {
  status: AppStatusDef;
  /** Pergunta de novo ao backend: "Tentar de novo" e a hora da previsão (ou o fim da contagem). Sem ele, não há botão. */
  onRetry?: () => void;
  /** Tela toda (sistema fora do ar, o padrão) ou só a área de conteúdo do layout (página `comingSoon`). */
  fullScreen?: boolean;
}

/** Maior espera do setTimeout (cerca de 24 dias). */
const MAX_TIMEOUT = 2 ** 31 - 1;

/** Manutenção com a previsão de retorno, ou lançamento com a data e a contagem regressiva. */
export function AppStatus({ status, onRetry, fullScreen = true }: AppStatusProps) {
  const intl = useIntl();
  const text = useText();
  const maintenance = status.mode === 'maintenance';
  const until = untilTime(status.until);
  const left = until === undefined ? 0 : until - Date.now();

  // manutenção com previsão: quando chega a hora, pergunta de novo sozinha (a contagem do "Em breve" já faz isso)
  useEffect(() => {
    if (!maintenance || !onRetry || until === undefined || until <= Date.now()) return;
    const timer = setTimeout(onRetry, Math.min(until - Date.now(), MAX_TIMEOUT));
    return () => clearTimeout(timer);
  }, [maintenance, onRetry, until]);

  return (
    <MessagePage
      fullScreen={fullScreen}
      icon={
        <SoftAvatar size="xl" tone={maintenance ? 'warning' : 'primary'}>
          {maintenance ? <Setting4 size={36} /> : <Clock size={36} />}
        </SoftAvatar>
      }
      title={text(
        status.title,
        intl.formatMessage({
          id: maintenance ? 'c3.status.maintenance' : 'c3.status.comingSoon',
          defaultMessage: maintenance ? 'Em manutenção' : 'Em breve'
        })
      )}
      description={text(status.message)}
      action={
        onRetry &&
        maintenance && (
          <Button variant="contained" onClick={onRetry}>
            {intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' })}
          </Button>
        )
      }
    >
      {!maintenance && left > 0 && <Countdown until={until!} onDone={onRetry} />}
      {until !== undefined && (
        <Typography color="text.secondary">
          {intl.formatMessage(
            {
              id: maintenance ? 'c3.status.return' : 'c3.status.launch',
              defaultMessage: maintenance ? 'Previsão de retorno: {date}' : 'Lançamento: {date}'
            },
            { date: intl.formatDate(until, { dateStyle: 'long', timeStyle: 'short' }) }
          )}
        </Typography>
      )}
    </MessagePage>
  );
}

/** Recarrega a página inteira (o pedaço do código que quebrou pode ter mudado com uma versão nova). */
export const reloadPage = () => window.location.reload();

export interface ServerErrorProps {
  /** Tela cheia (padrão) ou só a área de conteúdo, com o menu em volta. */
  fullScreen?: boolean;
  /** Botões depois do "Tentar de novo" (ex.: "Voltar ao início", que precisa do roteador). */
  extra?: ReactNode;
}

/** Sem detalhes internos do erro na tela pública. */
export function ServerError({ fullScreen = true, extra }: ServerErrorProps) {
  const intl = useIntl();
  return (
    <MessagePage
      fullScreen={fullScreen}
      code="500"
      title={intl.formatMessage({ id: 'c3.status.error', defaultMessage: 'Algo deu errado' })}
      description={intl.formatMessage({ id: 'c3.status.errorHelp', defaultMessage: 'Não foi possível abrir esta tela. Tente novamente.' })}
      action={
        <>
          <Button variant="contained" onClick={reloadPage}>
            {intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' })}
          </Button>
          {extra}
        </>
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
