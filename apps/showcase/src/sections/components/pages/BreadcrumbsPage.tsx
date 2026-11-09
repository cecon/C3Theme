import { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Add, ArrowRight2, Category, Home2, Minus, ShoppingCart } from 'iconsax-reactjs';

import { Breadcrumbs } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const frame = { border: 1, borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.default' } as const;

function Trail({ separator }: { separator?: ReactNode }) {
  return (
    <MuiBreadcrumbs aria-label="Caminho" separator={separator}>
      <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard/padrao">
        Início
      </Link>
      <Link underline="hover" color="inherit" component={RouterLink} to="/componentes/trilha-de-navegacao">
        Catálogo
      </Link>
      <Typography color="text.primary">Cadeiras</Typography>
    </MuiBreadcrumbs>
  );
}

const iconLink = { display: 'flex', alignItems: 'center', gap: 0.75 } as const;

export default function BreadcrumbsPage() {
  return (
    <ExamplePage intro="A trilha de navegação mostra onde a pessoa está e permite voltar a níveis anteriores. No layout da C3 ela já aparece no topo de toda página, vinda do menu.">
      <Example
        title="Componente do layout (Breadcrumbs)"
        description="Do @c3theme/ui: monta o caminho a partir do menu ou de links explícitos."
        code={`<Breadcrumbs />                                   // caminho do menu + título
<Breadcrumbs heading={false} />                    // só o caminho
<Breadcrumbs heading={false} links={[{ title: 'Vendas', to: '/vendas' }, { title: 'Pedido 4521' }]} action={<Button>Novo pedido</Button>} />
// nível sem tela própria abre as telas do grupo, em vez de ser um link morto
<Breadcrumbs heading={false} links={[{ title: 'Tesouraria', options: [{ title: 'Caixas abertos', to: '/caixas', current: true }, ...] }, { title: 'Caixas abertos' }]} />`}
        wide
      >
        <Stack spacing={2}>
          <Box sx={frame}>
            <Breadcrumbs heading={false} />
          </Box>
          <Box sx={frame}>
            <Breadcrumbs
              heading={false}
              links={[
                { title: 'Vendas', to: '/componentes/trilha-de-navegacao' },
                { title: 'Pedidos', to: '/componentes/trilha-de-navegacao' },
                { title: 'Pedido 4521' }
              ]}
              action={
                <Button variant="contained" startIcon={<Add size={18} />}>
                  Novo pedido
                </Button>
              }
            />
          </Box>
          <Box sx={frame}>
            <Breadcrumbs
              heading={false}
              links={[
                {
                  title: 'Tesouraria',
                  options: [
                    { title: 'Caixas abertos', to: '/componentes/trilha-de-navegacao', current: true },
                    { title: 'Movimentos', to: '/componentes/botoes' },
                    { title: 'Conciliação', to: '/componentes/alertas' }
                  ]
                },
                { title: 'Caixas abertos' }
              ]}
            />
          </Box>
        </Stack>
      </Example>

      <Example
        title="Básica"
        code={`<Breadcrumbs aria-label="Caminho">
  <Link component={RouterLink} to="/">Início</Link>
  <Link component={RouterLink} to="/catalogo">Catálogo</Link>
  <Typography color="text.primary">Cadeiras</Typography>
</Breadcrumbs>`}
      >
        <Trail />
      </Example>

      <Example
        title="Separadores"
        code={`<Breadcrumbs separator="›">...</Breadcrumbs>
<Breadcrumbs separator={<ArrowRight2 size={12} />}>...</Breadcrumbs>`}
      >
        <Stack spacing={1.5}>
          <Trail separator="›" />
          <Trail separator="-" />
          <Trail separator={<ArrowRight2 size={12} />} />
          <Trail separator={<Minus size={12} />} />
        </Stack>
      </Example>

      <Example title="Com ícones" code={`<Link sx={{ display: 'flex', gap: 0.75 }}><Home2 size={16} /> Início</Link>`}>
        <Stack spacing={2}>
          <MuiBreadcrumbs aria-label="Caminho com ícones" separator={<ArrowRight2 size={12} />}>
            <Link underline="hover" color="inherit" component={RouterLink} to="/dashboard/padrao" sx={iconLink}>
              <Home2 size={16} />
              Início
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/componentes/trilha-de-navegacao" sx={iconLink}>
              <Category size={16} />
              Catálogo
            </Link>
            <Typography color="text.primary" sx={iconLink}>
              <ShoppingCart size={16} />
              Carrinho
            </Typography>
          </MuiBreadcrumbs>
          <MuiBreadcrumbs aria-label="Só ícone no início" separator={<ArrowRight2 size={12} />}>
            <Link color="inherit" component={RouterLink} to="/dashboard/padrao" aria-label="Início" sx={{ display: 'flex' }}>
              <Home2 size={18} />
            </Link>
            <Link underline="hover" color="inherit" component={RouterLink} to="/componentes/trilha-de-navegacao">
              Configurações
            </Link>
            <Typography color="text.primary">Usuários</Typography>
          </MuiBreadcrumbs>
        </Stack>
      </Example>

      <Example
        title="Recolhida"
        description="Caminhos longos mostram reticências; clique para expandir."
        code={`<Breadcrumbs maxItems={3} itemsBeforeCollapse={1} itemsAfterCollapse={2}>...</Breadcrumbs>`}
      >
        <MuiBreadcrumbs maxItems={3} itemsBeforeCollapse={1} itemsAfterCollapse={2} aria-label="Caminho recolhido">
          {['Início', 'Empresa', 'Filiais', 'Sul', 'Curitiba'].map((t) => (
            <Link key={t} underline="hover" color="inherit" component={RouterLink} to="/componentes/trilha-de-navegacao">
              {t}
            </Link>
          ))}
          <Typography color="text.primary">Equipe de vendas</Typography>
        </MuiBreadcrumbs>
      </Example>

      <Example
        title="Com título abaixo"
        description="Padrão do cabeçalho de página."
        code={`<Stack spacing={0.5}>
  <Breadcrumbs>...</Breadcrumbs>
  <Typography variant="h3" component="h2">Cadeiras</Typography>
</Stack>`}
      >
        <Stack spacing={0.5}>
          <Trail separator={<ArrowRight2 size={12} />} />
          <Typography variant="h3" component="p">
            Cadeiras
          </Typography>
        </Stack>
      </Example>

      <Example
        title="Em chips"
        code={`<Breadcrumbs><Chip label="Início" icon={<Home2 />} component={RouterLink} to="/" clickable /></Breadcrumbs>`}
      >
        <MuiBreadcrumbs aria-label="Caminho em chips">
          <Chip size="small" icon={<Home2 size={14} />} label="Início" component={RouterLink} to="/dashboard/padrao" clickable />
          <Chip size="small" label="Catálogo" component={RouterLink} to="/componentes/trilha-de-navegacao" clickable />
          <Chip size="small" label="Cadeiras" color="primary" />
        </MuiBreadcrumbs>
      </Example>
    </ExamplePage>
  );
}
