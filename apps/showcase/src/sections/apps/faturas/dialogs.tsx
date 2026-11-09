import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';

// third-party
import { SearchNormal1 } from 'iconsax-reactjs';

import { SoftAvatar } from '@c3theme/ui';
import { Address, Customer, CUSTOMERS } from './data';

/** Escolha do cliente da fatura, com busca por nome, e-mail ou documento. */
export function CustomerDialog({
  open,
  selectedId,
  onClose,
  onSelect
}: {
  open: boolean;
  selectedId?: string;
  onClose: () => void;
  onSelect: (c: Customer) => void;
}) {
  const [query, setQuery] = useState('');
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const q = query.trim().toLowerCase();
  const list = CUSTOMERS.filter((c) => !q || `${c.name} ${c.email} ${c.document}`.toLowerCase().includes(q));
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>Selecionar cliente</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder="Buscar por nome, e-mail, CPF ou CNPJ"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar cliente' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} />
                </InputAdornment>
              )
            }
          }}
          sx={{ p: 2 }}
        />
        <List disablePadding sx={{ maxHeight: { sm: 380 }, overflowY: 'auto' }}>
          {list.map((c) => (
            <ListItemButton
              key={c.id}
              selected={c.id === selectedId}
              onClick={() => {
                onSelect(c);
                onClose();
              }}
              sx={{ px: 2.5 }}
            >
              <ListItemAvatar>
                <SoftAvatar tone={c.document.length > 14 ? 'info' : 'primary'}>{c.name[0]}</SoftAvatar>
              </ListItemAvatar>
              <ListItemText
                primary={c.name}
                secondary={`${c.email} · ${c.address.city}/${c.address.state}`}
                slotProps={{ secondary: { noWrap: true } }}
              />
            </ListItemButton>
          ))}
          {list.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              Nenhum cliente encontrado.
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const FIELDS: { key: keyof Address; label: string; size: { xs: number; sm: number }; required: boolean }[] = [
  { key: 'street', label: 'Logradouro e número', size: { xs: 12, sm: 12 }, required: true },
  { key: 'district', label: 'Bairro', size: { xs: 12, sm: 6 }, required: false },
  { key: 'zip', label: 'CEP', size: { xs: 12, sm: 6 }, required: true },
  { key: 'city', label: 'Cidade', size: { xs: 8, sm: 9 }, required: true },
  { key: 'state', label: 'UF', size: { xs: 4, sm: 3 }, required: true }
];

function addressErrors(a: Address): Partial<Record<keyof Address, string>> {
  const e: Partial<Record<keyof Address, string>> = {};
  if (!a.street.trim()) e.street = 'Informe o logradouro.';
  if (!a.city.trim()) e.city = 'Informe a cidade.';
  if (!/^[A-Za-z]{2}$/.test(a.state.trim())) e.state = 'Use 2 letras.';
  if (!/^\d{5}-?\d{3}$/.test(a.zip.trim())) e.zip = 'CEP com 8 dígitos.';
  return e;
}

/** Edição de um endereço (cobrança ou entrega). */
export function AddressDialog({
  open,
  title,
  value,
  onClose,
  onSave
}: {
  open: boolean;
  title: string;
  value: Address;
  onClose: () => void;
  onSave: (a: Address) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [touched, setTouched] = useState(false);
  const errors = addressErrors(draft);
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    onSave({ ...draft, state: draft.state.trim().toUpperCase() });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      slotProps={{
        transition: {
          onEnter: () => {
            setDraft(value);
            setTouched(false);
          }
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {FIELDS.map((f) => (
            <Grid key={f.key} size={f.size}>
              <TextField
                label={f.label}
                required={f.required}
                fullWidth
                value={draft[f.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                error={touched && !!errors[f.key]}
                helperText={touched && errors[f.key]}
                slotProps={{ htmlInput: f.key === 'state' ? { maxLength: 2 } : f.key === 'zip' ? { inputMode: 'numeric' } : undefined }}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button variant="contained" onClick={save}>
          Salvar endereço
        </Button>
      </DialogActions>
    </Dialog>
  );
}
