import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Edit, Setting2, TrendUp } from 'iconsax-reactjs';
import { notify, Panel, SoftAvatar, SoftIconButton } from '@c3theme/ui';
import { brl, illustration, PEOPLE } from '../data';
import Example, { ExamplePage } from '../Example';
import { ComplexDemo, TabsCardDemo } from './cards/demos';

export default function CardsPage() {
  return (
    <ExamplePage intro="Cartões agrupam conteúdo e ações sobre um assunto. No C3, o Panel do @c3theme/ui é o cartão padrão das telas.">
      <Example
        title="Panel (padrão do C3)"
        description="Título, subtítulo, ação e corpo; flush para tabelas e listas; footer prende as ações embaixo quando o card estica até a altura da linha."
        code={`<Panel title="Equipe" subtitle="8 pessoas" action={<Button size="small">Ver todos</Button>}>...</Panel>
<Panel title="Últimos pedidos" flush>{lista}</Panel>
<Panel title="Responsáveis" flush footer={<Button fullWidth variant="outlined">Ver equipe</Button>}>...</Panel>`}
        wide
      >
        <Grid container spacing={2} sx={{ '& > .MuiGrid-root > .MuiPaper-root': { height: '100%' } }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title="Equipe" subtitle="8 pessoas" action={<Button size="small">Ver todos</Button>}>
              <Typography variant="body2" color="text.secondary">
                Conteúdo com espaçamento interno padrão.
              </Typography>
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Panel
              title="Configurações"
              action={
                <SoftIconButton aria-label="Editar" size="small">
                  <Setting2 size={16} />
                </SoftIconButton>
              }
            >
              <Typography variant="body2" color="text.secondary">
                Ação com botão de ícone suave.
              </Typography>
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Panel
              title="Responsáveis"
              flush
              footer={
                <Button fullWidth variant="outlined">
                  Ver equipe
                </Button>
              }
            >
              {PEOPLE.slice(0, 3).map((p, i) => (
                <Box key={p.id}>
                  {i > 0 && <Divider />}
                  <Typography variant="body2" sx={{ px: 2.5, py: 1.25 }}>
                    {p.name}
                  </Typography>
                </Box>
              ))}
            </Panel>
          </Grid>
        </Grid>
      </Example>

      <Example
        title="Básico"
        code={`<Card>
  <CardContent>...</CardContent>
  <CardActions><Button size="small">Saiba mais</Button></CardActions>
</Card>`}
      >
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Dica do dia
            </Typography>
            <Typography variant="h4" gutterBottom>
              Concilie o caixa diariamente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conferir entradas e saídas todo dia evita surpresas no fechamento do mês.
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small">Saiba mais</Button>
          </CardActions>
        </Card>
      </Example>

      <Example
        title="Contornado e elevado"
        code={`<Card variant="outlined">...</Card>
<Card variant="elevation" elevation={4}>...</Card>`}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Contornado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Padrão do tema: borda fina.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="elevation" elevation={4} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Elevado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sombra para destacar sobre o fundo.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Example>

      <Example
        title="Com imagem"
        code={`<Card>
  <CardMedia component="img" height="160" image={imagem} alt="..." />
  <CardContent>...</CardContent>
</Card>`}
      >
        <Card>
          <CardMedia component="img" height="160" image={illustration(200, 'Serra do Mar')} alt="Ilustração de montanhas" />
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pacote Serra do Mar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              3 diárias com café da manhã e passeio de trem até Morretes.
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Typography variant="h4" color="primary">
              {brl.format(1290)}
            </Typography>
            <Button variant="contained" onClick={() => notify('Pacote reservado.')}>
              Reservar
            </Button>
          </CardActions>
        </Card>
      </Example>

      <Example
        title="Área clicável"
        description="O cartão inteiro é um botão."
        code={`<Card><CardActionArea onClick={abrir}>...</CardActionArea></Card>`}
      >
        <Grid container spacing={2}>
          {[
            { title: 'Clientes', value: '1.284', tone: 'primary' as const },
            { title: 'Ticket médio', value: brl.format(186.4), tone: 'success' as const }
          ].map((k) => (
            <Grid key={k.title} size={{ xs: 12, sm: 6 }}>
              <Card>
                <CardActionArea onClick={() => notify(`Abrindo ${k.title.toLowerCase()}.`, 'info')} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <SoftAvatar tone={k.tone}>
                      <TrendUp size={20} />
                    </SoftAvatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {k.title}
                      </Typography>
                      <Typography variant="h4">{k.value}</Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Example>

      <Example
        title="Com cabeçalho e ações"
        code={`<Card>
  <CardHeader avatar={<SoftAvatar />} title="..." subheader="..." action={<IconButton aria-label="Editar" />} />
  <CardContent>...</CardContent>
</Card>`}
      >
        <Card>
          <CardHeader
            avatar={<SoftAvatar tone="info">FR</SoftAvatar>}
            title="Fernanda Rocha"
            subheader="Designer · Porto Alegre"
            action={
              <IconButton aria-label="Editar perfil">
                <Edit size={18} />
              </IconButton>
            }
          />
          <Divider />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Responsável pela identidade visual dos produtos e pelo guia de estilo da empresa.
            </Typography>
          </CardContent>
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button size="small" variant="outlined">
              Mensagem
            </Button>
            <Button size="small">Ver perfil</Button>
          </CardActions>
        </Card>
      </Example>

      <Example
        title="Interação completa"
        description="Curtir, compartilhar e expandir detalhes."
        code={`<Collapse in={expandido}><CardContent>...</CardContent></Collapse>`}
      >
        <ComplexDemo />
      </Example>

      <Example
        title="Com abas"
        code={`<Card>
  <CardHeader title="Vendas" />
  <Tabs value={aba} variant="fullWidth">...</Tabs>
  <CardContent>...</CardContent>
</Card>`}
      >
        <TabsCardDemo />
      </Example>
    </ExamplePage>
  );
}
