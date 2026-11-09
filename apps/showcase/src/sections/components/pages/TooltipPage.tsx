import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Zoom from '@mui/material/Zoom';

// third-party
import { Add, InfoCircle, Trash } from 'iconsax-reactjs';

import Example, { ExamplePage, Row } from '../Example';

const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
const LABEL: Record<(typeof COLORS)[number], string> = {
  primary: 'Primária',
  secondary: 'Secundária',
  success: 'Sucesso',
  warning: 'Atenção',
  error: 'Erro',
  info: 'Informação'
};

const PLACEMENTS: { placement: TooltipProps['placement']; label: string }[] = [
  { placement: 'top-start', label: 'Cima início' },
  { placement: 'top', label: 'Cima' },
  { placement: 'top-end', label: 'Cima fim' },
  { placement: 'left', label: 'Esquerda' },
  { placement: 'right', label: 'Direita' },
  { placement: 'bottom-start', label: 'Baixo início' },
  { placement: 'bottom', label: 'Baixo' },
  { placement: 'bottom-end', label: 'Baixo fim' }
];

const LONG =
  'O prazo de entrega começa a contar a partir da confirmação do pagamento. Pedidos feitos após as 14h entram na separação do dia seguinte.';

function ControlledDemo() {
  const [open, setOpen] = useState(false);
  const [clickOpen, setClickOpen] = useState(false);
  return (
    <Row gap={2}>
      <Tooltip open={open} onClose={() => setOpen(false)} onOpen={() => setOpen(true)} title="Controlado pelo estado">
        <Button variant="outlined">Passe o mouse ({open ? 'aberta' : 'fechada'})</Button>
      </Tooltip>
      <ClickAwayListener onClickAway={() => setClickOpen(false)}>
        <div>
          <Tooltip
            open={clickOpen}
            onClose={() => setClickOpen(false)}
            disableFocusListener
            disableHoverListener
            disableTouchListener
            title="Aberta pelo clique; clique fora para fechar"
            slotProps={{ popper: { disablePortal: true } }}
          >
            <Button variant="contained" onClick={() => setClickOpen(true)}>
              Clique
            </Button>
          </Tooltip>
        </div>
      </ClickAwayListener>
    </Row>
  );
}

export default function TooltipPage() {
  return (
    <ExamplePage intro="Dicas explicam um elemento ao passar o mouse, focar ou tocar. São essenciais em botões só com ícone.">
      <Example title="Simples" code={`<Tooltip title="Excluir"><IconButton aria-label="Excluir"><Trash /></IconButton></Tooltip>`}>
        <Row gap={2}>
          <Tooltip title="Excluir">
            <IconButton aria-label="Excluir">
              <Trash size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Adicionar">
            <IconButton aria-label="Adicionar" color="primary">
              <Add size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sem seta" arrow={false}>
            <Button>Sem seta</Button>
          </Tooltip>
        </Row>
      </Example>

      <Example title="Posições" code={`<Tooltip title="..." placement="bottom-end">...</Tooltip>`}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
          {PLACEMENTS.map((p) => (
            <Tooltip key={p.placement} title={`Posição: ${p.label}`} placement={p.placement}>
              <Button variant="outlined" size="small">
                {p.label}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Example>

      <Example
        title="Cores"
        description="Fundo na cor do tema."
        code={`<Tooltip title="..." slotProps={{ tooltip: { sx: { bgcolor: 'success.main' } }, arrow: { sx: { color: 'success.main' } } }} />`}
      >
        <Row gap={1}>
          {COLORS.map((c) => (
            <Tooltip
              key={c}
              title={`Dica ${LABEL[c].toLowerCase()}`}
              slotProps={{
                tooltip: { sx: { bgcolor: `${c}.main`, color: `${c}.contrastText` } },
                arrow: { sx: { color: `${c}.main` } }
              }}
            >
              <Button color={c} variant="outlined" size="small">
                {LABEL[c]}
              </Button>
            </Tooltip>
          ))}
        </Row>
      </Example>

      <Example
        title="Personalizada"
        description="Conteúdo rico e fundo claro."
        code={`<Tooltip title={<><b>Título</b><br />Texto</>} slotProps={{ tooltip: { sx: { bgcolor: 'background.paper', color: 'text.primary', boxShadow: 3 } } }} />`}
      >
        <Row gap={2}>
          <Tooltip
            title={
              <Stack spacing={0.5} sx={{ p: 0.5 }}>
                <Typography variant="subtitle2">Imposto estimado</Typography>
                <Typography variant="caption" color="text.secondary">
                  Calculado com a alíquota do Simples Nacional da sua faixa de faturamento.
                </Typography>
              </Stack>
            }
            slotProps={{
              tooltip: {
                sx: { bgcolor: 'background.paper', color: 'text.primary', boxShadow: 6, border: 1, borderColor: 'divider', maxWidth: 260 }
              },
              arrow: { sx: { color: 'background.paper', '&::before': { border: 1, borderColor: 'divider' } } }
            }}
          >
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', cursor: 'help' }} tabIndex={0}>
              <Typography variant="body2">Imposto: R$ 312,40</Typography>
              <InfoCircle size={16} />
            </Stack>
          </Tooltip>
        </Row>
      </Example>

      <Example title="Largura variável" code={`<Tooltip title={textoLongo} slotProps={{ tooltip: { sx: { maxWidth: 'none' } } }} />`}>
        <Row gap={1}>
          <Tooltip title={LONG}>
            <Button size="small">Largura padrão</Button>
          </Tooltip>
          <Tooltip title={LONG} slotProps={{ tooltip: { sx: { maxWidth: 500 } } }}>
            <Button size="small">Mais larga</Button>
          </Tooltip>
          <Tooltip title={LONG} slotProps={{ tooltip: { sx: { maxWidth: 'none' } } }}>
            <Button size="small">Sem limite</Button>
          </Tooltip>
        </Row>
      </Example>

      <Example
        title="Interativa ou não"
        description="Por padrão a dica fica aberta enquanto o mouse está sobre ela."
        code={`<Tooltip disableInteractive title="..." />`}
      >
        <Row gap={1}>
          <Tooltip title="Pode passar o mouse aqui">
            <Button variant="outlined">Interativa</Button>
          </Tooltip>
          <Tooltip title="Some ao sair do botão" disableInteractive>
            <Button variant="outlined">Não interativa</Button>
          </Tooltip>
        </Row>
      </Example>

      <Example
        title="Em elemento desabilitado"
        description="Envolva com um span, já que botões desabilitados não recebem eventos."
        code={`<Tooltip title="Sem permissão"><span><Button disabled>Excluir</Button></span></Tooltip>`}
      >
        <Tooltip title="Você não tem permissão para excluir">
          <span>
            <Button variant="contained" color="error" disabled>
              Excluir
            </Button>
          </span>
        </Tooltip>
      </Example>

      <Example title="Transições" code={`<Tooltip slots={{ transition: Zoom }} title="..." />`}>
        <Row gap={1}>
          <Tooltip title="Crescer (padrão)">
            <Button>Crescer</Button>
          </Tooltip>
          <Tooltip title="Esmaecer" slots={{ transition: Fade }} slotProps={{ transition: { timeout: 500 } }}>
            <Button>Esmaecer</Button>
          </Tooltip>
          <Tooltip title="Zoom" slots={{ transition: Zoom }}>
            <Button>Zoom</Button>
          </Tooltip>
        </Row>
      </Example>

      <Example
        title="Atraso"
        description="Espera antes de abrir e de fechar."
        code={`<Tooltip enterDelay={500} leaveDelay={200} title="..." />`}
      >
        <Row gap={1}>
          <Tooltip title="Abriu depois de 500 ms" enterDelay={500}>
            <Button variant="outlined">Atraso para abrir</Button>
          </Tooltip>
          <Tooltip title="Fecha depois de 800 ms" leaveDelay={800}>
            <Button variant="outlined">Atraso para fechar</Button>
          </Tooltip>
        </Row>
      </Example>

      <Example title="Controlada" code={`<Tooltip open={aberta} onOpen={() => setAberta(true)} onClose={() => setAberta(false)} />`}>
        <ControlledDemo />
      </Example>
    </ExamplePage>
  );
}
