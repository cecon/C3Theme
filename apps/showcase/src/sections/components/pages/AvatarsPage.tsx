import { ReactNode } from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Folder2, Gallery, Heart, Profile2User, TickCircle, User } from 'iconsax-reactjs';

import { SoftAvatar, type Tone } from '@c3theme/ui';
import { initials, PEOPLE, portrait } from '../data';
import Example, { ExamplePage, Row } from '../Example';

const TONES: Tone[] = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral'];
// imagem inválida (sem requisição de rede) para demonstrar o fallback
const BROKEN = 'data:image/png;base64,AAAA';
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

function OnlineBadge({ children, online }: { children: ReactNode; online: boolean }) {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      color={online ? 'success' : 'default'}
      sx={{
        '& .MuiBadge-dot': {
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: 2,
          borderColor: 'background.paper',
          bgcolor: online ? undefined : 'text.disabled'
        }
      }}
    >
      {children}
    </Badge>
  );
}

export default function AvatarsPage() {
  return (
    <ExamplePage intro="Avatares representam pessoas ou objetos com foto, iniciais ou ícone. O SoftAvatar do @c3theme/ui aplica as cores do tema.">
      <Example
        title="Básico"
        description="Foto, iniciais e ícone."
        code={`<Avatar alt="Ana Souza" src={foto} />
<Avatar>AS</Avatar>
<Avatar><User /></Avatar>`}
      >
        <Row>
          <Avatar alt="Ana Beatriz Souza" src={portrait(210)} />
          <Avatar alt="Carlos Lima" src={portrait(30)} />
          <Avatar>AS</Avatar>
          <Avatar>
            <User size={20} />
          </Avatar>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Gallery size={20} />
          </Avatar>
        </Row>
      </Example>

      <Example
        title="Cores (SoftAvatar)"
        description="Fundo suave em cada tom do tema."
        code={`<SoftAvatar tone="success">CL</SoftAvatar>`}
      >
        <Row>
          {TONES.map((tone, i) => (
            <SoftAvatar key={tone} tone={tone} aria-label={tone}>
              {initials(PEOPLE[i]!.name)}
            </SoftAvatar>
          ))}
        </Row>
      </Example>

      <Example
        title="Aparências"
        description="Suave, cheio e contornado."
        code={`<SoftAvatar look="soft" />
<SoftAvatar look="filled" />
<SoftAvatar look="outlined" />`}
      >
        <Stack spacing={1.5}>
          {(['soft', 'filled', 'outlined'] as const).map((look) => (
            <Row key={look}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
                {{ soft: 'Suave', filled: 'Cheio', outlined: 'Contornado' }[look]}
              </Typography>
              {TONES.slice(0, 6).map((tone) => (
                <SoftAvatar key={tone} tone={tone} look={look} size="sm">
                  <User size={16} />
                </SoftAvatar>
              ))}
            </Row>
          ))}
        </Stack>
      </Example>

      <Example title="Tamanhos" code={`<SoftAvatar size="xs" /> ... <SoftAvatar size="xl" />`}>
        <Row align="center">
          {SIZES.map((size) => (
            <SoftAvatar key={size} size={size}>
              FR
            </SoftAvatar>
          ))}
          {SIZES.map((size) => (
            <SoftAvatar key={`img-${size}`} size={size} src={portrait(140)} alt="Fernanda Rocha" />
          ))}
        </Row>
      </Example>

      <Example
        title="Formatos"
        code={`<Avatar variant="rounded" />
<Avatar variant="square" />`}
      >
        <Row>
          <SoftAvatar tone="info">
            <Folder2 size={20} />
          </SoftAvatar>
          <SoftAvatar tone="info" variant="rounded">
            <Folder2 size={20} />
          </SoftAvatar>
          <SoftAvatar tone="info" variant="square">
            <Folder2 size={20} />
          </SoftAvatar>
          <Avatar variant="rounded" src={portrait(330)} alt="Mariana Costa" />
          <Avatar variant="square" src={portrait(90)} alt="Rafael Martins" />
        </Row>
      </Example>

      <Example
        title="Alternativas quando a foto falha"
        description="Cai para as iniciais do alt ou para o ícone padrão."
        code={`<Avatar alt="Thiago" src="/foto-que-nao-existe.jpg" />`}
      >
        <Row>
          <Avatar alt="Thiago Nascimento" src={BROKEN}>
            TN
          </Avatar>
          <Avatar alt="Luciana" src={BROKEN} />
          <Avatar src={BROKEN} />
        </Row>
      </Example>

      <Example
        title="Grupo"
        description="Mostra +N quando passa do máximo."
        code={`<AvatarGroup max={4}>{pessoas.map(...)}</AvatarGroup>
<AvatarGroup total={24}>...</AvatarGroup>`}
      >
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <AvatarGroup max={4}>
            {PEOPLE.map((p) => (
              <Tooltip key={p.id} title={p.name}>
                <SoftAvatar tone={p.tone}>{initials(p.name)}</SoftAvatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          <AvatarGroup total={24} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 13 } }}>
            {[200, 20, 120, 280].map((h) => (
              <Avatar key={h} src={portrait(h)} alt="Integrante" />
            ))}
          </AvatarGroup>
        </Stack>
      </Example>

      <Example
        title="Com emblema"
        description="Status online e selo de verificação."
        code={`<Badge overlap="circular" variant="dot" color="success" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
  <Avatar src={foto} />
</Badge>`}
      >
        <Row gap={2.5}>
          {PEOPLE.slice(0, 3).map((p) => (
            <OnlineBadge key={p.id} online={!!p.online}>
              <SoftAvatar tone={p.tone}>{initials(p.name)}</SoftAvatar>
            </OnlineBadge>
          ))}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Stack sx={{ color: 'primary.main', bgcolor: 'background.paper', borderRadius: '50%' }}>
                <TickCircle size={18} variant="Bold" />
              </Stack>
            }
          >
            <Avatar src={portrait(260)} alt="Perfil verificado" sx={{ width: 48, height: 48 }} />
          </Badge>
          <Badge overlap="circular" badgeContent={3} color="error">
            <SoftAvatar tone="neutral">
              <Profile2User size={20} />
            </SoftAvatar>
          </Badge>
        </Row>
      </Example>

      <Example title="Com ícone" code={`<SoftAvatar tone="danger"><Heart variant="Bold" /></SoftAvatar>`}>
        <Row>
          <SoftAvatar tone="danger">
            <Heart size={20} variant="Bold" />
          </SoftAvatar>
          <SoftAvatar tone="success" look="filled">
            <TickCircle size={20} />
          </SoftAvatar>
          <SoftAvatar tone="warning" look="outlined">
            <Gallery size={20} />
          </SoftAvatar>
        </Row>
      </Example>
    </ExamplePage>
  );
}
