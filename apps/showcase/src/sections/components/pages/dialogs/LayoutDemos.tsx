// Diálogos com layout próprio: customizado, tela cheia, tamanhos e responsivo.
import { forwardRef, ReactElement, Ref, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Breakpoint, Theme } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import { CloseCircle } from 'iconsax-reactjs';
import { notify } from '@c3theme/ui';

export function CustomizedDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Novidades da versão
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="custom-titulo">
        <DialogTitle id="custom-titulo" sx={{ pr: 7 }}>
          Novidades da versão 3.2
        </DialogTitle>
        <IconButton
          aria-label="Fechar"
          onClick={() => setOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}
        >
          <CloseCircle size={20} />
        </IconButton>
        <DialogContent dividers>
          <Typography gutterBottom>Relatórios agora podem ser agendados e enviados por e-mail toda segunda-feira.</Typography>
          <Typography gutterBottom>A busca de clientes aceita CPF e CNPJ com ou sem pontuação.</Typography>
          <Typography>O modo escuro ficou mais confortável para longas jornadas.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const SlideUp = forwardRef(function SlideUp(props: TransitionProps & { children: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function FullScreenDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Abrir em tela cheia
      </Button>
      <Dialog fullScreen open={open} onClose={() => setOpen(false)} slots={{ transition: SlideUp }}>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Toolbar>
            <IconButton edge="start" aria-label="Fechar" onClick={() => setOpen(false)}>
              <CloseCircle size={22} />
            </IconButton>
            <Typography variant="h5" sx={{ ml: 1, flex: 1 }}>
              Nova proposta
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setOpen(false);
                notify('Proposta salva.');
              }}
            >
              Salvar
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, maxWidth: 720, width: '100%', mx: 'auto' }}>
          <Stack spacing={2}>
            <TextField label="Cliente" fullWidth defaultValue="Padaria Pão Dourado" />
            <TextField label="Título" fullWidth defaultValue="Reforma da vitrine" />
            <TextField label="Descrição" fullWidth multiline rows={6} />
          </Stack>
        </Box>
      </Dialog>
    </>
  );
}

export function SizesDemo() {
  const [open, setOpen] = useState(false);
  const [maxWidth, setMaxWidth] = useState<Breakpoint | false>('sm');
  const [fullWidth, setFullWidth] = useState(true);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Abrir e testar tamanhos
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth={maxWidth} fullWidth={fullWidth}>
        <DialogTitle>Tamanho do diálogo</DialogTitle>
        <DialogContent>
          <DialogContentText>Escolha a largura máxima e se ocupa toda essa largura.</DialogContentText>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, alignItems: { sm: 'center' } }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="max-label">Largura máxima</InputLabel>
              <Select
                labelId="max-label"
                label="Largura máxima"
                value={maxWidth === false ? 'false' : maxWidth}
                onChange={(e) => setMaxWidth(e.target.value === 'false' ? false : (e.target.value as Breakpoint))}
              >
                <MenuItem value="false">Sem limite</MenuItem>
                {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={fullWidth} onChange={(e) => setFullWidth(e.target.checked)} />}
              label="Largura total"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ResponsiveDemo() {
  const [open, setOpen] = useState(false);
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('md'));
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Abrir diálogo responsivo
      </Button>
      <Dialog fullScreen={fullScreen} open={open} onClose={() => setOpen(false)} aria-labelledby="resp-titulo">
        <DialogTitle id="resp-titulo">Ativar localização?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Em telas pequenas este diálogo ocupa a tela inteira; em telas grandes fica centralizado. Usamos a localização só para sugerir a
            filial mais próxima.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Agora não</Button>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Permitir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
