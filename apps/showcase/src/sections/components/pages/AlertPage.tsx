import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// third-party
import { Box1, CloseCircle, Lock, MagicStar, Setting2 } from 'iconsax-reactjs';

import { MessagePage, notify, SoftAvatar } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const SEVERITIES = [
  { severity: 'success', title: 'Tudo certo', text: 'O pedido foi enviado para o financeiro.' },
  { severity: 'info', title: 'Para sua informação', text: 'A manutenção programada é no domingo às 2h.' },
  { severity: 'warning', title: 'Atenção', text: 'O certificado digital vence em 7 dias.' },
  { severity: 'error', title: 'Algo deu errado', text: 'Não conseguimos emitir a nota fiscal.' }
] as const;

function DismissDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Collapse in={open} sx={{ width: '100%' }}>
        <Alert
          severity="info"
          action={
            <IconButton aria-label="Fechar aviso" color="inherit" size="small" onClick={() => setOpen(false)}>
              <CloseCircle size={18} />
            </IconButton>
          }
        >
          Este aviso some ao clicar no X.
        </Alert>
      </Collapse>
      <Button variant="outlined" size="small" disabled={open} onClick={() => setOpen(true)}>
        Mostrar de novo
      </Button>
    </Stack>
  );
}

type MessageKind = 'naoEncontrada' | 'manutencao' | 'vazio';

function MessageDemo() {
  const [kind, setKind] = useState<MessageKind>('naoEncontrada');
  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={kind}
        onChange={(_, v: MessageKind | null) => v && setKind(v)}
        aria-label="Tipo de recado"
      >
        <ToggleButton value="naoEncontrada">Não encontrada</ToggleButton>
        <ToggleButton value="manutencao">Manutenção</ToggleButton>
        <ToggleButton value="vazio">Lista vazia</ToggleButton>
      </ToggleButtonGroup>
      <Paper variant="outlined" sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
        {kind === 'naoEncontrada' && (
          <MessagePage
            code="404"
            title="Página não encontrada"
            description="O endereço pode ter mudado ou a página foi removida."
            action={<Button variant="contained">Voltar ao início</Button>}
          />
        )}
        {kind === 'manutencao' && (
          <MessagePage
            icon={
              <SoftAvatar tone="warning" size="xl">
                <Setting2 size={32} />
              </SoftAvatar>
            }
            title="Estamos em manutenção"
            description="Voltamos às 6h. Seus dados estão seguros."
            action={<Button variant="outlined">Ver status</Button>}
          />
        )}
        {kind === 'vazio' && (
          <MessagePage
            icon={
              <SoftAvatar tone="neutral" size="xl">
                <Box1 size={32} />
              </SoftAvatar>
            }
            title="Nenhum pedido ainda"
            description="Quando você receber pedidos, eles aparecem aqui."
            action={
              <Button variant="contained" onClick={() => notify('Abriria o cadastro de pedido.', 'info')}>
                Criar pedido
              </Button>
            }
          />
        )}
      </Paper>
    </Stack>
  );
}

export default function AlertPage() {
  return (
    <ExamplePage intro="Alertas comunicam algo importante dentro da página, sem interromper. Para avisos rápidos que somem sozinhos, use notify (veja Avisos).">
      <Example
        title="Básico"
        description="Fundo suave nas quatro severidades."
        code={`<Alert severity="success">O pedido foi enviado.</Alert>`}
      >
        <Stack spacing={1.5}>
          {SEVERITIES.map((s) => (
            <Alert key={s.severity} severity={s.severity}>
              {s.text}
            </Alert>
          ))}
        </Stack>
      </Example>

      <Example
        title="Com título"
        code={`<Alert severity="warning">
  <AlertTitle>Atenção</AlertTitle>
  O certificado digital vence em 7 dias.
</Alert>`}
      >
        <Stack spacing={1.5}>
          {SEVERITIES.map((s) => (
            <Alert key={s.severity} severity={s.severity}>
              <AlertTitle>{s.title}</AlertTitle>
              {s.text}
            </Alert>
          ))}
        </Stack>
      </Example>

      <Example title="Preenchido" code={`<Alert variant="filled" severity="error">...</Alert>`}>
        <Stack spacing={1.5}>
          {SEVERITIES.map((s) => (
            <Alert key={s.severity} severity={s.severity} variant="filled">
              {s.text}
            </Alert>
          ))}
        </Stack>
      </Example>

      <Example title="Contornado" code={`<Alert variant="outlined" severity="info">...</Alert>`}>
        <Stack spacing={1.5}>
          {SEVERITIES.map((s) => (
            <Alert key={s.severity} severity={s.severity} variant="outlined">
              {s.text}
            </Alert>
          ))}
        </Stack>
      </Example>

      <Example
        title="Com ações"
        code={`<Alert action={<Button color="inherit" size="small">Renovar</Button>}>...</Alert>
<Alert onClose={() => {}}>...</Alert>`}
      >
        <Stack spacing={1.5}>
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => notify('Renovação iniciada.', 'info')}>
                Renovar
              </Button>
            }
          >
            O certificado digital vence em 7 dias.
          </Alert>
          <Alert severity="success" onClose={() => notify('Fechado.', 'info')}>
            Backup concluído às 03:00.
          </Alert>
          <Alert
            severity="error"
            variant="filled"
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={() => notify('Tentando de novo…', 'info')}>
                  Tentar de novo
                </Button>
              </Stack>
            }
          >
            Falha ao sincronizar o estoque.
          </Alert>
        </Stack>
      </Example>

      <Example
        title="Ícones"
        description="Troque ou esconda o ícone."
        code={`<Alert icon={<Lock />} severity="info">...</Alert>
<Alert icon={false} severity="success">...</Alert>`}
      >
        <Stack spacing={1.5}>
          <Alert icon={<Lock size={20} />} severity="info">
            Sua sessão está protegida com verificação em duas etapas.
          </Alert>
          <Alert icon={<MagicStar size={20} />} severity="success" variant="outlined">
            Nova função disponível: relatórios automáticos.
          </Alert>
          <Alert icon={false} severity="warning">
            Alerta sem ícone.
          </Alert>
        </Stack>
      </Example>

      <Example
        title="Descartável"
        description="Some com animação e pode voltar."
        code={`<Collapse in={aberto}>
  <Alert action={<IconButton aria-label="Fechar" onClick={() => setAberto(false)}><CloseCircle /></IconButton>}>...</Alert>
</Collapse>`}
      >
        <DismissDemo />
      </Example>

      <Example
        title="Página de recado (MessagePage)"
        description="Do @c3theme/ui: erro, manutenção ou estado vazio, dentro do layout ou em tela cheia."
        code={`<MessagePage code="404" title="Página não encontrada" description="..." action={<Button>Voltar ao início</Button>} />
<MessagePage icon={<SoftAvatar size="xl"><Box1 /></SoftAvatar>} title="Nenhum pedido ainda" />`}
        wide
      >
        <MessageDemo />
      </Example>
    </ExamplePage>
  );
}
