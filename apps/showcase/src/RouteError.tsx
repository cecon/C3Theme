import { Link as RouterLink, useRouteError } from 'react-router';

// material-ui
import Button from '@mui/material/Button';

import { MessagePage } from '@c3theme/ui';

export function NotFound() {
  return (
    <MessagePage
      code="404"
      title="Página não encontrada"
      description="Essa tela não existe na vitrine."
      action={
        <Button component={RouterLink} to="/" variant="contained">
          Voltar ao início
        </Button>
      }
    />
  );
}

export function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <MessagePage
      fullScreen
      code="500"
      title="Algo deu errado"
      description={error instanceof Error ? error.message : 'Erro inesperado.'}
      action={
        <Button variant="contained" onClick={() => window.location.reload()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
