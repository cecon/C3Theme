import { useState } from 'react';

// material-ui
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

// third-party
import { Add, Minus, Notification, ShoppingCart, Sms } from 'iconsax-reactjs';

import { SoftAvatar, softColors, type Tone } from '@c3theme/ui';
import Example, { ExamplePage, Row } from '../Example';

const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
const SOFT_TONES: Tone[] = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];

function Square() {
  return <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }} />;
}

function VisibilityDemo() {
  const [count, setCount] = useState(3);
  const [invisible, setInvisible] = useState(false);
  return (
    <Stack spacing={2}>
      <Row gap={3}>
        <Badge color="primary" badgeContent={count} invisible={invisible}>
          <ShoppingCart size={26} />
        </Badge>
        <ButtonGroup size="small" aria-label="Quantidade">
          <Button aria-label="Diminuir" onClick={() => setCount((c) => Math.max(0, c - 1))}>
            <Minus size={16} />
          </Button>
          <Button aria-label="Aumentar" onClick={() => setCount((c) => c + 1)}>
            <Add size={16} />
          </Button>
        </ButtonGroup>
        <FormControlLabel control={<Switch checked={!invisible} onChange={(e) => setInvisible(!e.target.checked)} />} label="Mostrar" />
      </Row>
      <Row gap={3}>
        <Badge color="error" badgeContent={0}>
          <Sms size={26} />
        </Badge>
        <Badge color="error" badgeContent={0} showZero>
          <Sms size={26} />
        </Badge>
        <Typography variant="body2" color="text.secondary">
          Zero fica oculto, a menos que use showZero.
        </Typography>
      </Row>
    </Stack>
  );
}

export default function BadgesPage() {
  return (
    <ExamplePage intro="Emblemas mostram contagens ou um ponto de atenção sobre um ícone ou avatar.">
      <Example title="Básico" code={`<Badge badgeContent={4} color="primary"><Notification /></Badge>`}>
        <Row gap={3}>
          <Badge badgeContent={4} color="primary">
            <Notification size={26} />
          </Badge>
          <IconButton aria-label="12 mensagens não lidas">
            <Badge badgeContent={12} color="error">
              <Sms size={22} />
            </Badge>
          </IconButton>
          <IconButton aria-label="Carrinho com 2 itens">
            <Badge badgeContent={2} color="success">
              <ShoppingCart size={22} />
            </Badge>
          </IconButton>
        </Row>
      </Example>

      <Example title="Cores" code={`<Badge badgeContent={4} color="warning">...</Badge>`}>
        <Row gap={3}>
          {COLORS.map((c, i) => (
            <Badge key={c} badgeContent={i + 1} color={c}>
              <Square />
            </Badge>
          ))}
        </Row>
      </Example>

      <Example
        title="Suaves"
        description="Fundo suave com softColors do @c3theme/ui."
        code={`<Badge badgeContent={5} sx={(t) => ({ '& .MuiBadge-badge': softColors(t, 'success') })}>...</Badge>`}
      >
        <Row gap={3}>
          {SOFT_TONES.map((tone, i) => (
            <Badge key={tone} badgeContent={i + 5} sx={(t) => ({ '& .MuiBadge-badge': { ...softColors(t, tone), fontWeight: 600 } })}>
              <Square />
            </Badge>
          ))}
        </Row>
      </Example>

      <Example
        title="Valor máximo"
        description="Acima do máximo aparece 99+ (ou o limite definido)."
        code={`<Badge badgeContent={1000} max={999} color="error">...</Badge>`}
      >
        <Row gap={3.5}>
          <Badge badgeContent={99} color="error">
            <Notification size={26} />
          </Badge>
          <Badge badgeContent={100} color="error">
            <Notification size={26} />
          </Badge>
          <Badge badgeContent={1000} max={999} color="error">
            <Notification size={26} />
          </Badge>
        </Row>
      </Example>

      <Example title="Ponto" description="Só sinaliza que há novidade." code={`<Badge variant="dot" color="error">...</Badge>`}>
        <Row gap={3}>
          <Badge variant="dot" color="error">
            <Notification size={26} />
          </Badge>
          <Badge variant="dot" color="primary">
            <Typography>Novidades</Typography>
          </Badge>
          <Badge variant="dot" color="success" overlap="circular">
            <SoftAvatar tone="neutral">JP</SoftAvatar>
          </Badge>
        </Row>
      </Example>

      <Example
        title="Visibilidade"
        code={`<Badge badgeContent={qtd} invisible={oculto} />
<Badge badgeContent={0} showZero />`}
      >
        <VisibilityDemo />
      </Example>

      <Example
        title="Sobreposição"
        description="Retangular para quadrados, circular para avatares."
        code={`<Badge overlap="circular" ...><Avatar /></Badge>`}
      >
        <Row gap={3}>
          <Badge color="primary" badgeContent=" " variant="dot">
            <Square />
          </Badge>
          <Badge color="primary" badgeContent={5}>
            <Square />
          </Badge>
          <Badge color="primary" overlap="circular" variant="dot">
            <SoftAvatar tone="info">FR</SoftAvatar>
          </Badge>
          <Badge color="primary" overlap="circular" badgeContent={5}>
            <SoftAvatar tone="info">FR</SoftAvatar>
          </Badge>
        </Row>
      </Example>

      <Example
        title="Alinhamento"
        description="Em qualquer canto."
        code={`<Badge anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} />`}
      >
        <Row gap={3.5}>
          {(
            [
              ['top', 'right'],
              ['top', 'left'],
              ['bottom', 'right'],
              ['bottom', 'left']
            ] as const
          ).map(([vertical, horizontal]) => (
            <Badge key={vertical + horizontal} badgeContent={9} color="secondary" anchorOrigin={{ vertical, horizontal }}>
              <Square />
            </Badge>
          ))}
        </Row>
      </Example>
    </ExamplePage>
  );
}
