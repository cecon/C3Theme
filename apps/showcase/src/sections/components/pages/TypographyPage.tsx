// material-ui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { FONT_OPTIONS, ScrollX, useUiConfig } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

type Variant = NonNullable<TypographyProps['variant']>;

const SCALE: { variant: Variant; sample: string; use: string }[] = [
  { variant: 'h1', sample: 'Relatório anual', use: 'Título de página especial (landing, número grande)' },
  { variant: 'h2', sample: 'Visão geral de vendas', use: 'Títulos de páginas de recado' },
  { variant: 'h3', sample: 'Pedidos do mês', use: 'Título da página (cabeçalho do layout)' },
  { variant: 'h4', sample: 'Resumo financeiro', use: 'Destaques e títulos de diálogos' },
  { variant: 'h5', sample: 'Últimas movimentações', use: 'Título de Panel e cartões' },
  { variant: 'h6', sample: 'Detalhes do cliente', use: 'Subtítulos pequenos' },
  { variant: 'subtitle1', sample: 'Ana Beatriz Souza', use: 'Nome em listas, título de item' },
  { variant: 'subtitle2', sample: 'Dados de cobrança', use: 'Rótulos de grupo' },
  { variant: 'body1', sample: 'O pedido foi enviado para o financeiro e será faturado amanhã.', use: 'Texto corrido' },
  { variant: 'body2', sample: 'Entrega prevista para 22 de outubro, em Curitiba – PR.', use: 'Texto padrão de telas e tabelas' },
  { variant: 'button', sample: 'Salvar alterações', use: 'Botões (sem caixa alta)' },
  { variant: 'caption', sample: 'Atualizado há 5 minutos', use: 'Legendas e textos de apoio' },
  { variant: 'overline', sample: 'Plano Empresa', use: 'Sobretítulos e categorias' }
];

const remToPx = (v: string | number | undefined, base = 16) => {
  if (typeof v === 'number') return `${v}px`;
  if (!v) return '—';
  return v.endsWith('rem') ? `${Math.round(parseFloat(v) * base * 10) / 10}px` : v;
};

function Scale() {
  const theme = useTheme();
  return (
    <ScrollX>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell>Variante</TableCell>
            <TableCell>Exemplo</TableCell>
            <TableCell>Tamanho</TableCell>
            <TableCell>Peso</TableCell>
            <TableCell>Altura da linha</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {SCALE.map(({ variant, sample, use }) => {
            const t = theme.typography[variant as keyof typeof theme.typography] as {
              fontSize?: string | number;
              fontWeight?: string | number;
              lineHeight?: string | number;
            };
            return (
              <TableRow key={variant}>
                <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'ui-monospace, monospace' }}>
                    {variant}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant={variant} component="div">
                    {sample}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {use}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{remToPx(t.fontSize)}</TableCell>
                <TableCell>{t.fontWeight ?? 400}</TableCell>
                <TableCell>{t.lineHeight ?? '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollX>
  );
}

function FontFamily() {
  const theme = useTheme();
  const { config } = useUiConfig();
  const current = FONT_OPTIONS.find((f) => f.value === (config.fontFamily ?? theme.typography.fontFamily))?.label ?? 'Personalizada';
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: '3rem', fontWeight: 600, lineHeight: 1 }}>Aa</Typography>
      <Typography variant="h4">{current}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-word' }}>
        {theme.typography.fontFamily}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Troque a fonte no painel de aparência ({FONT_OPTIONS.map((f) => f.label).join(', ')}).
      </Typography>
      <Typography sx={{ letterSpacing: '0.02em' }}>
        ABCDEFGHIJKLMNOPQRSTUVWXYZ · abcdefghijklmnopqrstuvwxyz · 0123456789 · ãçéêíõú R$ %
      </Typography>
    </Stack>
  );
}

export default function TypographyPage() {
  return (
    <ExamplePage intro="A escala tipográfica do tema C3. Os valores da tabela são lidos do tema; o tamanho base do texto é 14 px.">
      <Example
        title="Escala do tema"
        code={`<Typography variant="h3" component="h1">Pedidos do mês</Typography>
<Typography variant="body2" color="text.secondary">Texto de apoio</Typography>`}
        wide
      >
        <Scale />
      </Example>

      <Example title="Família da fonte" description="Muda com a preferência de fonte." code={`theme.typography.fontFamily`}>
        <FontFamily />
      </Example>

      <Example
        title="Cores"
        code={`<Typography color="text.secondary">...</Typography>
<Typography color="error">...</Typography>`}
      >
        <Stack spacing={0.5}>
          <Typography color="text.primary">Texto principal</Typography>
          <Typography color="text.secondary">Texto secundário</Typography>
          <Typography color="text.disabled">Texto desabilitado</Typography>
          <Typography color="primary">Primária</Typography>
          <Typography color="secondary">Secundária</Typography>
          <Typography color="success.main">Sucesso</Typography>
          <Typography color="warning.main">Atenção</Typography>
          <Typography color="error">Erro</Typography>
          <Typography color="info.main">Informação</Typography>
        </Stack>
      </Example>

      <Example
        title="Estilos"
        code={`<Typography sx={{ fontWeight: 700 }}>Negrito</Typography>
<Typography sx={{ fontStyle: 'italic' }}>Itálico</Typography>`}
      >
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 400 }}>Peso normal (400)</Typography>
          <Typography sx={{ fontWeight: 500 }}>Peso médio (500)</Typography>
          <Typography sx={{ fontWeight: 600 }}>Peso seminegrito (600)</Typography>
          <Typography sx={{ fontWeight: 700 }}>Negrito (700)</Typography>
          <Typography sx={{ fontStyle: 'italic' }}>Itálico</Typography>
          <Typography sx={{ textDecoration: 'underline' }}>Sublinhado</Typography>
          <Typography sx={{ textDecoration: 'line-through' }}>Riscado</Typography>
          <Typography sx={{ textTransform: 'uppercase' }}>Caixa alta</Typography>
          <Typography sx={{ fontFamily: 'ui-monospace, monospace' }}>Monoespaçado: 123.456.789-09</Typography>
        </Stack>
      </Example>

      <Example title="Alinhamento" code={`<Typography align="center">...</Typography>`}>
        <Stack spacing={1.5}>
          {(['left', 'center', 'right', 'justify'] as const).map((a) => (
            <Typography key={a} align={a} variant="body2" sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
              {
                {
                  left: 'À esquerda (início)',
                  center: 'Centralizado',
                  right: 'À direita (fim)',
                  justify: 'Justificado: o texto ocupa toda a largura da linha, distribuindo o espaço entre as palavras de forma uniforme.'
                }[a]
              }
            </Typography>
          ))}
        </Stack>
      </Example>

      <Example
        title="Espaçamento e corte"
        description="gutterBottom adiciona margem; noWrap corta com reticências."
        code={`<Typography gutterBottom>...</Typography>
<Typography noWrap>...</Typography>`}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Título com margem inferior
            </Typography>
            <Typography variant="body2" color="text.secondary">
              O parágrafo começa um pouco abaixo do título.
            </Typography>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 260, border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
            <Typography noWrap>Rua Desembargador Westphalen, 1500 – Rebouças, Curitiba – PR</Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 360 }}
          >
            Limite de duas linhas: este texto continua por bastante tempo para mostrar como o corte acontece depois da segunda linha, sem
            quebrar o layout.
          </Typography>
        </Stack>
      </Example>

      <Example
        title="Links"
        code={`<Link href="#">Padrão</Link>
<Link underline="hover">Sublinha ao passar</Link>`}
      >
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Link href="#links" onClick={(e) => e.preventDefault()}>
            Link padrão
          </Link>
          <Link href="#links" underline="hover" onClick={(e) => e.preventDefault()}>
            Sublinha ao passar
          </Link>
          <Link href="#links" underline="none" color="text.secondary" onClick={(e) => e.preventDefault()}>
            Sem sublinhado
          </Link>
          <Link href="#links" variant="body2" color="error" onClick={(e) => e.preventDefault()}>
            Link de erro
          </Link>
          <Link component="button" variant="body2" onClick={() => undefined}>
            Link como botão
          </Link>
        </Stack>
      </Example>

      <Example title="Parágrafo" code={`<Typography variant="body1" sx={{ mb: 2 }}>...</Typography>`}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          A C3 desenvolve sistemas de gestão para pequenas e médias empresas brasileiras. Nossos produtos cuidam de vendas, estoque,
          finanças e emissão de notas fiscais em um só lugar.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Textos longos ficam mais confortáveis com linhas de até 80 caracteres e espaçamento entre parágrafos.
        </Typography>
      </Example>
    </ExamplePage>
  );
}
