// Diálogos simples: lista, alerta, formulário e confirmação.
import { FormEvent, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Add, Danger, Trash } from 'iconsax-reactjs';
import { notify, SoftAvatar } from '@c3theme/ui';
import { initials, PEOPLE } from '../../data';

export const TERMS = Array.from(
  { length: 18 },
  (_, i) =>
    `${i + 1}. Cláusula de exemplo: as partes concordam que os serviços serão prestados conforme o escopo descrito na proposta comercial, com reajuste anual pelo IPCA e aviso prévio de 30 dias para cancelamento.`
);

export function SimpleDemo() {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState(PEOPLE[0]!.name);
  const pick = (name: string) => {
    setChosen(name);
    setOpen(false);
  };
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        Responsável: <b>{chosen}</b>
      </Typography>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Trocar responsável
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="simples-titulo">
        <DialogTitle id="simples-titulo">Escolha o responsável</DialogTitle>
        <List sx={{ pt: 0, pb: 1, px: 1 }}>
          {PEOPLE.slice(0, 4).map((p) => (
            <ListItem key={p.id} disablePadding>
              <ListItemButton selected={p.name === chosen} onClick={() => pick(p.name)}>
                <ListItemAvatar>
                  <SoftAvatar tone={p.tone}>{initials(p.name)}</SoftAvatar>
                </ListItemAvatar>
                <ListItemText primary={p.name} secondary={p.role} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={() => notify('Abriria o cadastro de pessoa.', 'info')}>
              <ListItemAvatar>
                <SoftAvatar tone="neutral">
                  <Add size={20} />
                </SoftAvatar>
              </ListItemAvatar>
              <ListItemText primary="Adicionar pessoa" />
            </ListItemButton>
          </ListItem>
        </List>
      </Dialog>
    </Stack>
  );
}

export function AlertDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outlined" color="error" startIcon={<Trash size={18} />} onClick={() => setOpen(true)}>
        Excluir cliente
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="alerta-titulo" aria-describedby="alerta-texto" maxWidth="xs">
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <SoftAvatar tone="danger" size="lg" sx={{ mx: 'auto', mb: 2 }}>
            <Danger size={28} />
          </SoftAvatar>
          <Typography id="alerta-titulo" variant="h4" gutterBottom>
            Excluir este cliente?
          </Typography>
          <DialogContentText id="alerta-texto">
            O histórico de pedidos de Mercado Bom Preço Ltda. será apagado. Não dá para desfazer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button onClick={() => setOpen(false)} autoFocus>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setOpen(false);
              notify('Cliente excluído.');
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function FormDemo() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const invalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Convidar pessoa
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: (e: FormEvent<HTMLDivElement>) => {
              e.preventDefault();
              if (!email || invalid) return;
              notify(`Convite enviado para ${email}.`);
              setEmail('');
              setOpen(false);
            }
          }
        }}
      >
        <DialogTitle>Convidar para a equipe</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Enviaremos um link de acesso válido por 7 dias.</DialogContentText>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              label="E-mail"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={invalid}
              helperText={invalid ? 'Informe um e-mail válido.' : ' '}
            />
            <TextField select label="Perfil" defaultValue="vendedor" fullWidth>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="vendedor">Vendedor</MenuItem>
              <MenuItem value="leitura">Somente leitura</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Enviar convite
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const RINGTONES = ['Padrão', 'Sino', 'Marimba', 'Digital', 'Suave', 'Clássico', 'Alerta curto'];

export function ConfirmationDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('Sino');
  const [draft, setDraft] = useState(value);
  return (
    <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <ListItemButton
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
      >
        <ListItemText primary="Som de notificação" secondary={value} />
      </ListItemButton>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Som de notificação</DialogTitle>
        <DialogContent dividers>
          <RadioGroup aria-label="Som" value={draft} onChange={(e) => setDraft(e.target.value)}>
            {RINGTONES.map((r) => (
              <FormControlLabel key={r} value={r} control={<Radio />} label={r} />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setValue(draft);
              setOpen(false);
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </List>
  );
}
