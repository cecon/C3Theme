// Telas de erro da shell em volta do 500 do `AppStatus`: a tela que quebrou (errorElement do roteador), o sistema que
// não abriu e o 404.

import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link as RouterLink, useRouteError } from 'react-router';

// material-ui
import Button from '@mui/material/Button';

import { MessagePage, useBranding } from '@c3theme/ui';
import { ServerError } from './AppStatus';

function HomeButton() {
  const intl = useIntl();
  const { homePath } = useBranding();
  return (
    <Button component={RouterLink} to={homePath} variant="outlined">
      {intl.formatMessage({ id: 'c3.status.home', defaultMessage: 'Voltar ao início' })}
    </Button>
  );
}

/**
 * Erro inesperado numa tela (`errorElement`): o 500 com "Voltar ao início". Dentro do layout, o menu continua;
 * `fullScreen` quando a própria moldura quebrou. O erro vai para o console, nunca para a tela.
 */
export function RouteErrorScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  const error = useRouteError();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ServerError fullScreen={fullScreen} extra={<HomeButton />} />;
}

export interface LoadErrorScreenProps {
  /** Mensagem do erro (ex.: 'Erro 502.' ou 'Sem conexão com o servidor.'). */
  message: string;
  /** Status HTTP da falha; 5xx mostra o código grande. */
  httpStatus?: number;
  onRetry: () => void;
}

/** O sistema não abriu (GET /_meta/* falhou): tela cheia, fora do roteador, com "Tentar de novo". */
export function LoadErrorScreen({ message, httpStatus, onRetry }: LoadErrorScreenProps) {
  const intl = useIntl();
  return (
    <MessagePage
      fullScreen
      code={(httpStatus ?? 0) >= 500 ? String(httpStatus) : undefined}
      title={intl.formatMessage({ id: 'c3.status.loadError', defaultMessage: 'Não foi possível abrir o sistema' })}
      description={message}
      action={
        <Button variant="contained" onClick={onRetry}>
          {intl.formatMessage({ id: 'c3.status.retry', defaultMessage: 'Tentar de novo' })}
        </Button>
      }
    />
  );
}

/** Rota que não existe, dentro do layout. */
export function NotFoundScreen() {
  const intl = useIntl();
  return (
    <MessagePage
      code="404"
      title={intl.formatMessage({ id: 'c3.status.notFound', defaultMessage: 'Página não encontrada' })}
      description={intl.formatMessage({
        id: 'c3.status.notFoundHelp',
        defaultMessage: 'O endereço não existe ou mudou. Confira o link ou volte ao início.'
      })}
      action={<HomeButton />}
    />
  );
}
