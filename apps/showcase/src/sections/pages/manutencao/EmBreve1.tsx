// material-ui
import Typography from '@mui/material/Typography';

import { MessagePage } from '@c3theme/ui';
import { Countdown, LaunchArt, SubscribeForm, TopBar } from './shared';

export default function ComingSoonPage() {
  return (
    <>
      <TopBar />
      <MessagePage
        fullScreen
        icon={<LaunchArt />}
        title="Algo novo vem aí"
        description="Estamos preparando o novo módulo de estoque. Deixe seu e-mail e seja avisado no dia do lançamento."
      >
        <Countdown />
        <SubscribeForm />
        <Typography variant="caption" color="text.secondary">
          Sem spam: só um e-mail no lançamento.
        </Typography>
      </MessagePage>
    </>
  );
}
