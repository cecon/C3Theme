import { FormEvent, ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Trash } from 'iconsax-reactjs';

import { notify, Panel, SoftIconButton } from '@c3theme/ui';
import { HorizontalField } from '../shared';

type Align = 'flex-start' | 'flex-end' | 'space-between';

/** Faixa de botões com fundo levemente destacado. */
function Bar({ align = 'flex-end', children }: { align?: Align; children: ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{ px: 2.5, py: 1.5, gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: align, bgcolor: 'action.hover' }}
    >
      {children}
    </Stack>
  );
}

function Fields({ prefix }: { prefix: string }) {
  return (
    <Stack spacing={2.5} sx={{ p: 2.5 }}>
      <TextField id={`${prefix}-nome`} label="Nome do evento" placeholder="Ex.: Reunião trimestral" fullWidth />
      <TextField id={`${prefix}-local`} label="Local" placeholder="Sala 3 ou link da chamada" fullWidth />
    </Stack>
  );
}

function ActionForm({ title, children }: { title: string; children: ReactNode }) {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    notify(`${title}: enviado.`);
  };
  return (
    <Panel title={title} flush>
      <form onSubmit={onSubmit}>{children}</form>
    </Panel>
  );
}

const SubmitButtons = () => (
  <>
    <Button color="secondary">Cancelar</Button>
    <Button type="submit" variant="contained">
      Salvar
    </Button>
  </>
);

function DeleteEvent() {
  const [open, setOpen] = useState(false);
  return (
    <Panel
      title="Ação lateral"
      flush
      action={
        <Tooltip title="Excluir evento">
          <SoftIconButton tone="danger" aria-label="Excluir evento" onClick={() => setOpen(true)}>
            <Trash size={18} />
          </SoftIconButton>
        </Tooltip>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          notify('Evento atualizado.');
        }}
      >
        <Fields prefix="lat" />
        <Divider />
        <Bar>
          <SubmitButtons />
        </Bar>
      </form>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Excluir este evento?</DialogTitle>
        <DialogContent>
          <DialogContentText>Os convidados serão avisados do cancelamento. Essa ação não pode ser desfeita.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Voltar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setOpen(false);
              notify('Evento excluído.', 'info');
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Panel>
  );
}

export default function ActionBarPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActionForm title="Barra simples">
          <Fields prefix="s" />
          <Divider />
          <Bar>
            <SubmitButtons />
          </Bar>
        </ActionForm>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActionForm title="Alinhada à esquerda">
          <Fields prefix="e" />
          <Divider />
          <Bar align="flex-start">
            <Button type="submit" variant="contained">
              Salvar
            </Button>
            <Button color="secondary">Cancelar</Button>
          </Bar>
        </ActionForm>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActionForm title="Botão e link">
          <Stack spacing={2.5} sx={{ p: 2.5 }}>
            <TextField label="E-mail" type="email" fullWidth />
            <TextField label="Senha" type="password" fullWidth autoComplete="current-password" />
          </Stack>
          <Divider />
          <Bar align="space-between">
            <Button type="submit" variant="contained">
              Entrar
            </Button>
            <Link component="button" type="button" variant="body2" onClick={() => notify('Enviamos um link de recuperação.', 'info')}>
              Esqueceu a senha?
            </Link>
          </Bar>
        </ActionForm>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActionForm title="Barras em cima e embaixo">
          <Bar align="space-between">
            <Typography variant="body2" color="text.secondary">
              Rascunho salvo às 14:32
            </Typography>
            <Button size="small" type="submit" variant="outlined">
              Publicar
            </Button>
          </Bar>
          <Divider />
          <Fields prefix="tb" />
          <Divider />
          <Bar>
            <SubmitButtons />
          </Bar>
        </ActionForm>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DeleteEvent />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActionForm title="Formulário horizontal">
          <Stack spacing={2.5} sx={{ p: 2.5 }}>
            <HorizontalField label="Nome" htmlFor="hz-nome">
              <TextField id="hz-nome" size="small" fullWidth />
            </HorizontalField>
            <HorizontalField label="E-mail" htmlFor="hz-email">
              <TextField id="hz-email" size="small" type="email" fullWidth />
            </HorizontalField>
          </Stack>
          <Divider />
          <Bar>
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
            <SubmitButtons />
          </Bar>
        </ActionForm>
      </Grid>
    </Grid>
  );
}
