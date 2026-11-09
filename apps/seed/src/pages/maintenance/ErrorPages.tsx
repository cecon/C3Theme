import { useEffect, useState } from 'react';
import { Link as RouterLink, useRouteError } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Clock, Setting4 } from 'iconsax-reactjs';

import { MessagePage, SoftAvatar, useBranding } from '@c3theme/ui';

function HomeButton() {
  const { homePath } = useBranding();
  return (
    <Button component={RouterLink} to={homePath} variant="contained">
      Voltar ao início
    </Button>
  );
}

export function NotFoundPage({ fullScreen }: { fullScreen?: boolean }) {
  return (
    <MessagePage
      fullScreen={fullScreen}
      code="404"
      title="Página não encontrada"
      description="O endereço não existe ou mudou. Confira o link ou volte ao início."
      action={<HomeButton />}
    />
  );
}

/** Erro inesperado numa rota (usado como `errorElement` do roteador). */
export function ServerErrorPage() {
  const error = useRouteError();
  if (error) console.error(error);
  return (
    <MessagePage
      fullScreen
      code="500"
      title="Algo deu errado"
      description="Tivemos um problema ao abrir esta tela. Tente de novo; se continuar, fale com o suporte."
      action={
        <>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Tentar de novo
          </Button>
          <HomeButton />
        </>
      }
    />
  );
}

export function UnderConstructionPage() {
  return (
    <MessagePage
      fullScreen
      icon={
        <SoftAvatar size="xl" tone="warning">
          <Setting4 size={36} />
        </SoftAvatar>
      }
      title="Em manutenção"
      description="Estamos fazendo melhorias. O sistema volta em instantes."
      action={<HomeButton />}
    />
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

export function ComingSoonPage({ launch = new Date(Date.now() + 1000 * 60 * 60 * 24 * 12) }: { launch?: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, launch.getTime() - now) / 1000;
  const parts = [
    { label: 'dias', value: Math.floor(left / 86400) },
    { label: 'horas', value: Math.floor((left % 86400) / 3600) },
    { label: 'min', value: Math.floor((left % 3600) / 60) },
    { label: 'seg', value: Math.floor(left % 60) }
  ];

  return (
    <MessagePage
      fullScreen
      icon={
        <SoftAvatar size="xl">
          <Clock size={36} />
        </SoftAvatar>
      }
      title="Em breve"
      description="Esta funcionalidade está quase pronta."
      action={<HomeButton />}
    >
      <Stack direction="row" spacing={1.5} role="timer" aria-label="Contagem regressiva">
        {parts.map((p) => (
          <Stack
            key={p.label}
            sx={{
              alignItems: 'center',
              minWidth: 64,
              py: 1.5,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h3">{pad(p.value)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {p.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </MessagePage>
  );
}
