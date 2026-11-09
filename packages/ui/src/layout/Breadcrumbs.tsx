import { ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';

// material-ui
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowRight2, Home2 } from 'iconsax-reactjs';

import { useBranding } from '../config';
import { useNav } from './nav';
import { CrumbOption, menuCrumbs } from './crumbs';
import CrumbMenu from './CrumbMenu';
import { useUiText } from '../i18n';

export interface BreadcrumbLink {
  title: ReactNode;
  /** Rota do nível. Ignorada no último item: ele é a página atual. */
  to?: string;
  /** Nível sem rota própria: abre esta lista de telas em vez de ficar só como texto. */
  options?: CrumbOption[];
}

export interface BreadcrumbsProps {
  /** Caminho explícito; sem isso, sai do menu a partir da URL atual. */
  links?: BreadcrumbLink[];
  /** Mostra o título da página (último item) em destaque abaixo do caminho. */
  heading?: boolean;
  /** Ações à direita do título (botões da página). */
  action?: ReactNode;
}

/**
 * Caminho da página atual: Início › grupo › item. Por padrão vem do menu (o item ativo e seus pais);
 * páginas fora do menu passam `links`. Níveis com rota são links; grupo sem tela própria abre a lista das
 * telas dele; o último item é a página atual (texto, `aria-current="page"`). Sem caminho, não renderiza nada.
 */
export default function Breadcrumbs({ links, heading = true, action }: BreadcrumbsProps) {
  const groups = useNav();
  const { pathname, search } = useLocation();
  const { homePath } = useBranding();
  const t = useUiText();

  const trail: BreadcrumbLink[] = links ?? menuCrumbs(groups, pathname, search);
  if (!trail.length) return null;

  const last = trail[trail.length - 1]!;
  return (
    <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
        <MuiBreadcrumbs
          separator={<ArrowRight2 size={12} />}
          aria-label={t('c3.breadcrumbs')}
          sx={(theme) => ({ '& .MuiBreadcrumbs-separator': { mx: 0.5, transform: theme.direction === 'rtl' ? 'scaleX(-1)' : undefined } })}
        >
          <Link component={RouterLink} to={homePath} color="text.secondary" sx={{ display: 'flex' }} aria-label={t('c3.home')}>
            <Home2 size={16} />
          </Link>
          {trail.map((l, i) => {
            if (i === trail.length - 1) {
              return (
                <Typography key={i} variant="body2" color="text.primary" aria-current="page">
                  {l.title}
                </Typography>
              );
            }
            if (l.to) {
              return (
                <Link key={i} component={RouterLink} to={l.to} color="text.secondary" underline="hover" variant="body2">
                  {l.title}
                </Link>
              );
            }
            if (l.options?.length) return <CrumbMenu key={i} title={l.title} options={l.options} />;
            return (
              <Typography key={i} variant="body2" color="text.secondary">
                {l.title}
              </Typography>
            );
          })}
        </MuiBreadcrumbs>
        {heading && (
          <Typography variant="h3" component="h1" noWrap>
            {last.title}
          </Typography>
        )}
      </Stack>
      {action}
    </Stack>
  );
}
