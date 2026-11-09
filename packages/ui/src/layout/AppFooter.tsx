import { Link as RouterLink } from 'react-router';

// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useBranding } from '../config';

export interface FooterLink {
  label: string;
  /** Rota interna ou URL externa (começando com http). */
  href: string;
}

/** Rodapé do conteúdo: texto à esquerda (padrão "© ano nome") e links à direita. */
export default function AppFooter({ text, links = [] }: { text?: string; links?: FooterLink[] }) {
  const { name } = useBranding();
  return (
    <Stack
      component="footer"
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1, py: 2.5, mt: 'auto' }}
    >
      <Typography variant="caption" color="text.secondary">
        {text ?? `© ${new Date().getFullYear()} ${name}`}
      </Typography>
      <Stack direction="row" spacing={2}>
        {links.map((l) => {
          const external = /^https?:/.test(l.href);
          return (
            <Link
              key={l.label}
              variant="caption"
              color="text.secondary"
              underline="hover"
              {...(external ? { href: l.href, target: '_blank', rel: 'noreferrer' } : { component: RouterLink, to: l.href })}
            >
              {l.label}
            </Link>
          );
        })}
      </Stack>
    </Stack>
  );
}
