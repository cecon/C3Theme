import { ReactNode, useState } from 'react';

// material-ui
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Example, { ExamplePage } from '../Example';

// caixa centralizada usada pelos modais desta página
function ModalBox({ children, width = 420, labelledBy }: { children: ReactNode; width?: number; labelledBy?: string }) {
  return (
    <Box
      role="document"
      aria-labelledby={labelledBy}
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `min(${width}px, calc(100% - 32px))`,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: 24,
        p: 3,
        outline: 'none'
      }}
    >
      {children}
    </Box>
  );
}

function BasicDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Abrir modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="modal-basico">
        <ModalBox labelledBy="modal-basico">
          <Typography id="modal-basico" variant="h4" gutterBottom>
            Modal básico
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            O Modal é a base do Dialog: um fundo escuro e um conteúdo por cima. Feche clicando fora ou com Esc.
          </Typography>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </ModalBox>
      </Modal>
    </>
  );
}

function ChildModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Abrir modal filho
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="modal-filho">
        <ModalBox width={320} labelledBy="modal-filho">
          <Typography id="modal-filho" variant="h5" gutterBottom>
            Modal filho
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fica por cima do primeiro. Esc fecha só este.
          </Typography>
          <Button onClick={() => setOpen(false)}>Fechar filho</Button>
        </ModalBox>
      </Modal>
    </>
  );
}

function NestedDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Abrir modal pai
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="modal-pai">
        <ModalBox labelledBy="modal-pai">
          <Typography id="modal-pai" variant="h4" gutterBottom>
            Modal pai
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Modais podem abrir outros modais. Evite mais de dois níveis.
          </Typography>
          <Stack direction="row" spacing={1}>
            <ChildModal />
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </Stack>
        </ModalBox>
      </Modal>
    </>
  );
}

function TransitionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Abrir com transição
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
        aria-labelledby="modal-transicao"
      >
        <Fade in={open} timeout={500}>
          <Box>
            <ModalBox labelledBy="modal-transicao">
              <Typography id="modal-transicao" variant="h4" gutterBottom>
                Entrada suave
              </Typography>
              <Typography color="text.secondary">Fundo e conteúdo aparecem e somem com esmaecimento de 500 ms.</Typography>
            </ModalBox>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

function ContainedDemo() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <Box
      ref={setContainer}
      sx={{
        position: 'relative',
        height: 240,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider'
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Conteúdo da área por trás do modal.
        </Typography>
      </Box>
      {container && (
        <Modal
          open
          disablePortal
          disableEnforceFocus
          disableAutoFocus
          disableScrollLock
          hideBackdrop={false}
          container={container}
          aria-labelledby="modal-contido"
          sx={{ position: 'absolute' }}
          slotProps={{ backdrop: { sx: { position: 'absolute' } } }}
        >
          <ModalBox width={300} labelledBy="modal-contido">
            <Typography id="modal-contido" variant="h5" gutterBottom>
              Modal dentro de um bloco
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Renderizado sem portal, preso a esta área. Útil em pré-visualizações e renderização no servidor.
            </Typography>
          </ModalBox>
        </Modal>
      )}
    </Box>
  );
}

export default function ModalPage() {
  return (
    <ExamplePage intro="O Modal é a peça de baixo nível dos diálogos, menus e gavetas. Use quando precisar de um layout livre sobre a página.">
      <Example
        title="Básico"
        code={`<Modal open={aberto} onClose={fechar} aria-labelledby="titulo">
  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>...</Box>
</Modal>`}
      >
        <BasicDemo />
      </Example>

      <Example
        title="Aninhado"
        code={`<Modal open={pai}>
  <Box>... <Modal open={filho}>...</Modal></Box>
</Modal>`}
      >
        <NestedDemo />
      </Example>

      <Example
        title="Transição"
        code={`<Modal closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 500 } }}>
  <Fade in={aberto}>...</Fade>
</Modal>`}
      >
        <TransitionDemo />
      </Example>

      <Example
        title="Sem portal"
        description="Preso a um contêiner, sem cobrir a página."
        code={`<Modal open disablePortal container={elemento} sx={{ position: 'absolute' }}>...</Modal>`}
      >
        <ContainedDemo />
      </Example>
    </ExamplePage>
  );
}
