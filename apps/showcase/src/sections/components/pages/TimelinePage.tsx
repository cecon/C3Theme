import { ElementType, ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { Box1, Card, Driving, ShoppingCart, TickCircle, Home2 } from 'iconsax-reactjs';

import { SoftAvatar, toneMain, type Tone } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

// ---------- linha do tempo montada com componentes do @mui/material ----------

interface Entry {
  title: ReactNode;
  description?: ReactNode;
  /** Texto do lado oposto (data, hora). */
  opposite?: ReactNode;
  tone?: Tone;
  look?: 'filled' | 'outlined';
  icon?: ElementType;
}

interface TimelineProps {
  items: Entry[];
  /** Lado do conteúdo: depois da linha, antes dela ou alternando. */
  position?: 'end' | 'start' | 'alternate';
  /** Conteúdo dentro de um cartão. */
  card?: boolean;
}

function Marker({ entry }: { entry: Entry }) {
  const tone = entry.tone ?? 'primary';
  if (entry.icon) {
    const Icon = entry.icon;
    return (
      <SoftAvatar tone={tone} size="sm" look={entry.look === 'filled' ? 'filled' : 'soft'}>
        <Icon size={16} />
      </SoftAvatar>
    );
  }
  return (
    <Box
      sx={(theme) => ({
        width: 14,
        height: 14,
        my: 0.75,
        borderRadius: '50%',
        border: 2,
        borderColor: toneMain(theme, tone),
        bgcolor: entry.look === 'outlined' ? 'transparent' : toneMain(theme, tone)
      })}
    />
  );
}

function EntryBody({ entry, card, showOpposite }: { entry: Entry; card?: boolean; showOpposite: boolean }) {
  const inner = (
    <>
      {showOpposite && entry.opposite && (
        <Typography variant="caption" color="text.secondary" component="div">
          {entry.opposite}
        </Typography>
      )}
      <Typography variant="subtitle1">{entry.title}</Typography>
      {entry.description && (
        <Typography variant="body2" color="text.secondary">
          {entry.description}
        </Typography>
      )}
    </>
  );
  if (!card) return inner;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, display: 'inline-block', textAlign: 'start', maxWidth: '100%' }}>
      {inner}
    </Paper>
  );
}

function Timeline({ items, position = 'end', card }: TimelineProps) {
  const compact = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const hasOpposite = items.some((e) => e.opposite);
  // no celular a linha fica sempre à esquerda e o texto oposto vai junto do conteúdo
  const mode = compact ? 'end' : position;
  const twoSided = !compact && (hasOpposite || mode === 'alternate');

  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((entry, i) => {
        const last = i === items.length - 1;
        const contentFirst = mode === 'start' || (mode === 'alternate' && i % 2 === 1);
        const body = (
          <Box sx={{ pb: last ? 0 : 3, pt: 0.25, textAlign: twoSided && contentFirst ? 'end' : 'start', minWidth: 0 }}>
            <EntryBody entry={entry} card={card} showOpposite={compact} />
          </Box>
        );
        const opposite = (
          <Box sx={{ pt: 0.5, textAlign: contentFirst ? 'start' : 'end' }}>
            <Typography variant="body2" color="text.secondary">
              {entry.opposite}
            </Typography>
          </Box>
        );
        const rail = (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2 }}>
            <Marker entry={entry} />
            {!last && <Box sx={{ flex: 1, width: 2, bgcolor: 'divider', mt: 1, minHeight: 24 }} />}
          </Box>
        );
        return (
          <Box
            component="li"
            key={i}
            sx={{
              display: 'grid',
              gridTemplateColumns: twoSided ? '1fr auto 1fr' : mode === 'start' ? '1fr auto' : 'auto 1fr'
            }}
          >
            {twoSided ? (
              contentFirst ? (
                <>
                  {body}
                  {rail}
                  {opposite}
                </>
              ) : (
                <>
                  {opposite}
                  {rail}
                  {body}
                </>
              )
            ) : mode === 'start' ? (
              <>
                {body}
                {rail}
              </>
            ) : (
              <>
                {rail}
                {body}
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ---------- dados ----------

const ORDER: Entry[] = [
  { title: 'Pedido recebido', description: 'Pedido 4521 registrado.', opposite: '14/10 · 09:12', tone: 'primary' },
  { title: 'Pagamento aprovado', description: 'Pix confirmado pelo banco.', opposite: '14/10 · 09:15', tone: 'success' },
  { title: 'Em separação', description: 'Itens conferidos no estoque de Curitiba.', opposite: '14/10 · 13:40', tone: 'info' },
  { title: 'Saiu para entrega', opposite: '15/10 · 08:05', tone: 'warning', look: 'outlined' }
];

const COLORED: Entry[] = [
  { title: 'Primária', tone: 'primary' },
  { title: 'Secundária', tone: 'secondary' },
  { title: 'Sucesso', tone: 'success' },
  { title: 'Atenção', tone: 'warning' },
  { title: 'Erro', tone: 'danger' },
  { title: 'Informação', tone: 'info', look: 'outlined' }
];

const DELIVERY: Entry[] = [
  { title: 'Compra', description: 'Carrinho fechado no site', opposite: '9h30', icon: ShoppingCart, tone: 'primary', look: 'filled' },
  { title: 'Pagamento', description: 'Cartão em 3x sem juros', opposite: '9h32', icon: Card, tone: 'success' },
  { title: 'Embalagem', description: 'Pacote de 2,4 kg', opposite: '11h00', icon: Box1, tone: 'info' },
  { title: 'Transporte', description: 'Transportadora parceira', opposite: '14h20', icon: Driving, tone: 'warning' },
  { title: 'Entregue', description: 'Recebido por Ana na portaria', opposite: '17h45', icon: Home2, tone: 'success', look: 'filled' }
];

const SIMPLE: Entry[] = [
  { title: 'Proposta enviada' },
  { title: 'Reunião com o cliente' },
  { title: 'Contrato assinado', tone: 'success' },
  { title: 'Projeto iniciado', icon: TickCircle, tone: 'success' }
];

const CODE_BASE = `// Linha do tempo feita com Box, Typography e SoftAvatar do @mui/material e @c3theme/ui
<Timeline
  position="end" // 'end' | 'start' | 'alternate'
  items={[
    { title: 'Pedido recebido', opposite: '14/10 · 09:12', tone: 'primary' },
    { title: 'Saiu para entrega', tone: 'warning', look: 'outlined' }
  ]}
/>`;

export default function TimelinePage() {
  return (
    <ExamplePage intro="A linha do tempo mostra eventos em ordem. Aqui ela é montada só com componentes do @mui/material (Box, Typography, Paper) e do @c3theme/ui, sem dependências extras.">
      <Example title="Básica" code={CODE_BASE}>
        <Timeline items={SIMPLE} />
      </Example>

      <Example title="Conteúdo à esquerda" code={`<Timeline position="start" items={...} />`}>
        <Timeline items={SIMPLE} position="start" />
      </Example>

      <Example title="Alternada" description="No celular vira uma coluna só." code={`<Timeline position="alternate" items={...} />`}>
        <Timeline items={SIMPLE} position="alternate" />
      </Example>

      <Example title="Cores e contorno" code={`{ title: 'Erro', tone: 'danger' }, { title: 'Informação', tone: 'info', look: 'outlined' }`}>
        <Timeline items={COLORED} />
      </Example>

      <Example
        title="Com lado oposto"
        description="Data e hora do outro lado da linha."
        code={`{ title: 'Pagamento aprovado', opposite: '14/10 · 09:15' }`}
      >
        <Timeline items={ORDER} />
      </Example>

      <Example
        title="Personalizada"
        description="Ícones, cartões e alternância."
        code={`<Timeline position="alternate" card items={[{ title: 'Compra', icon: ShoppingCart, tone: 'primary', look: 'filled' }]} />`}
        wide
      >
        <Timeline items={DELIVERY} position="alternate" card />
      </Example>
    </ExamplePage>
  );
}
