// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { LinearWithLabel, MessagePage, notify } from '@c3theme/ui';
import { ToolsArt, TopBar } from './shared';

export default function MaintenancePage() {
  return (
    <>
      <TopBar />
      <MessagePage
        fullScreen
        icon={<ToolsArt />}
        title="Estamos em manutenção"
        description="Estamos atualizando o sistema para deixá-lo mais rápido. Seus dados estão seguros e voltamos hoje, até as 23h."
        action={
          <>
            <Button variant="outlined" href="mailto:suporte@c3theme.dev">
              Falar com o suporte
            </Button>
            <Button variant="contained" onClick={() => notify('Ainda em manutenção. Tente de novo em alguns minutos.', 'info')}>
              Verificar de novo
            </Button>
          </>
        }
      >
        <Box sx={{ width: '100%', maxWidth: 360 }}>
          <LinearWithLabel label="Progresso da atualização" value={65} />
        </Box>
      </MessagePage>
    </>
  );
}
