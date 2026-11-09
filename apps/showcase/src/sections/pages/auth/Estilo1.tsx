import { Link as RouterLink, Outlet } from 'react-router';

// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AuthLayout } from '@c3theme/ui';
import { linksFor } from './fields';

const CONTEXT = linksFor('/paginas/auth');

/** Estilo 1: o cartão centralizado do `AuthLayout`, sem distrações. */
export default function AuthStyle1() {
  return (
    <AuthLayout footer={<AuthFooter />}>
      <Outlet context={CONTEXT} />
    </AuthLayout>
  );
}

export function AuthFooter() {
  return (
    <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        © 2026 C3 Vitrine
      </Typography>
      {['Termos', 'Privacidade', 'Ajuda'].map((l) => (
        <Link key={l} component={RouterLink} to="/paginas/fale-conosco" variant="caption" color="text.secondary" underline="hover">
          {l}
        </Link>
      ))}
    </Stack>
  );
}
