import { Link as RouterLink, Navigate, useLocation } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';

// third-party
import { SmsTracking } from 'iconsax-reactjs';

import { SoftAvatar } from '@c3theme/ui';
import { USING_MOCK } from '../../auth';
import { AuthHeading } from './shared';

export default function CheckMailPage() {
  const email = (useLocation().state as { email?: string } | null)?.email;
  if (!email) return <Navigate to="/forgot-password" replace />;

  return (
    <Stack spacing={2.5}>
      <SoftAvatar size="lg">
        <SmsTracking size={28} />
      </SoftAvatar>
      <AuthHeading
        title="Confira seu e-mail"
        subtitle={`Se existir uma conta para ${email}, você vai receber um código de verificação.${USING_MOCK ? ' No modo de demonstração o código é 123456.' : ''}`}
      />
      <Button component={RouterLink} to="/code-verification" state={{ email }} variant="contained" size="large">
        Digitar o código
      </Button>
      <Link component={RouterLink} to="/login" variant="body2" sx={{ textAlign: 'center' }}>
        Voltar ao login
      </Link>
    </Stack>
  );
}
