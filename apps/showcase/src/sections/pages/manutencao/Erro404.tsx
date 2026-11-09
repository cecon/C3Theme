import { Link as RouterLink, useNavigate } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import { MessagePage } from '@c3theme/ui';
import { LostArt, TopBar } from './shared';

const SHORTCUTS = [
  { label: 'Painel', to: '/dashboard/padrao' },
  { label: 'Faturas', to: '/apps/faturas/lista' },
  { label: 'Meu perfil', to: '/apps/perfil/usuario' },
  { label: 'Fale conosco', to: '/paginas/fale-conosco' }
];

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <TopBar />
      <MessagePage
        fullScreen
        icon={<LostArt />}
        code="404"
        title="Página não encontrada"
        description="O endereço pode ter mudado ou nunca existiu. Confira o link ou siga por um dos atalhos abaixo."
        action={
          <>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Voltar
            </Button>
            <Button component={RouterLink} to="/dashboard/padrao" variant="contained">
              Ir para o início
            </Button>
          </>
        }
      >
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {SHORTCUTS.map((s) => (
            <Chip key={s.to} label={s.label} component={RouterLink} to={s.to} clickable variant="outlined" />
          ))}
        </Stack>
      </MessagePage>
    </>
  );
}
