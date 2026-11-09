import { Link as RouterLink } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Copy } from 'iconsax-reactjs';

import { MessagePage, notify } from '@c3theme/ui';
import { TopBar, UnpluggedArt } from './shared';

const ERROR_ID = 'C3-500-7F2A91';

export default function ServerErrorPage() {
  const copy = () =>
    navigator.clipboard
      .writeText(ERROR_ID)
      .then(() => notify('Código copiado.', 'info'))
      .catch(() => notify('Não foi possível copiar.', 'warning'));
  return (
    <>
      <TopBar />
      <MessagePage
        fullScreen
        icon={<UnpluggedArt />}
        code="500"
        title="Algo deu errado do nosso lado"
        description="O servidor não conseguiu concluir o pedido. Já fomos avisados; tente de novo em alguns instantes."
        action={
          <>
            <Button component={RouterLink} to="/dashboard/padrao" variant="outlined">
              Ir para o início
            </Button>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Tentar de novo
            </Button>
          </>
        }
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            Código do erro: <strong>{ERROR_ID}</strong>
          </Typography>
          <Tooltip title="Copiar código">
            <IconButton size="small" aria-label="Copiar código do erro" onClick={copy}>
              <Copy size={14} />
            </IconButton>
          </Tooltip>
        </Stack>
      </MessagePage>
    </>
  );
}
