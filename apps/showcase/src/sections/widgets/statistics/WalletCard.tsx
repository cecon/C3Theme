import { FormEvent, MouseEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Add, Card, More, Wallet3 } from 'iconsax-reactjs';

import { notify, Panel, SoftAvatar, StatusChip } from '@c3theme/ui';
import { PaymentCard, WALLET_CARDS } from '../data';
import ConfirmDialog from '../kit/ConfirmDialog';
import { formatBRL } from '../kit/format';

/** Carteira: saldo, recarga e cartões vinculados (ativar, desativar, remover). */
export default function WalletCard() {
  const [balance, setBalance] = useState(12_840.5);
  const [cards, setCards] = useState<PaymentCard[]>(WALLET_CARDS);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [menu, setMenu] = useState<{ anchor: HTMLElement; card: PaymentCard } | null>(null);
  const [removing, setRemoving] = useState<PaymentCard | null>(null);

  const parsed = Number(amount.replace(',', '.'));
  const valid = parsed > 0 && parsed <= 50_000;

  function addFunds(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBalance((b) => b + parsed);
    notify(`${formatBRL(parsed)} adicionados à carteira.`, 'success');
    setAdding(false);
    setAmount('');
  }

  function toggle(card: PaymentCard) {
    setCards((list) => list.map((c) => (c.id === card.id ? { ...c, active: !c.active } : c)));
    notify(`Cartão final ${card.last4} ${card.active ? 'desativado' : 'ativado'}.`, 'info');
  }

  return (
    <Panel title="Carteira" flush>
      <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
        <SoftAvatar size="lg" variant="rounded">
          <Wallet3 size={28} variant="Bulk" />
        </SoftAvatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            Saldo disponível
          </Typography>
          <Typography variant="h3" component="p">
            {formatBRL(balance)}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ px: 2.5 }}>
        <Button fullWidth variant="contained" startIcon={<Add size={18} />} onClick={() => setAdding(true)}>
          Adicionar saldo
        </Button>
      </Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 2.5, pt: 2.5 }}>
        Cartões vinculados
      </Typography>
      <List disablePadding>
        {cards.map((card) => (
          <ListItem
            key={card.id}
            divider
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                aria-label={`Ações do cartão final ${card.last4}`}
                onClick={(e: MouseEvent<HTMLElement>) => setMenu({ anchor: e.currentTarget, card })}
              >
                <More size={18} style={{ transform: 'rotate(90deg)' }} />
              </IconButton>
            }
            sx={{ pl: 2.5, '&:last-of-type': { borderBottom: 0 } }}
          >
            <ListItemAvatar>
              <SoftAvatar tone={card.active ? 'primary' : 'neutral'} size="sm" variant="rounded">
                <Card size={16} />
              </SoftAvatar>
            </ListItemAvatar>
            <ListItemText primary={`${card.brand} •••• ${card.last4}`} secondary={card.holder} />
            <Box sx={{ mr: 1 }}>
              <StatusChip label={card.active ? 'Ativo' : 'Desativado'} tone={card.active ? 'success' : 'neutral'} />
            </Box>
          </ListItem>
        ))}
        {cards.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 2 }}>
            Nenhum cartão vinculado.
          </Typography>
        )}
      </List>

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) toggle(menu.card);
            setMenu(null);
          }}
        >
          {menu?.card.active ? 'Desativar' : 'Ativar'}
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            setRemoving(menu?.card ?? null);
            setMenu(null);
          }}
        >
          Remover
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={!!removing}
        title="Remover cartão"
        message={`O cartão ${removing?.brand ?? ''} final ${removing?.last4 ?? ''} deixará de ser usado nos pagamentos.`}
        confirmLabel="Remover"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          setCards((list) => list.filter((c) => c.id !== removing.id));
          notify('Cartão removido.', 'success');
        }}
      />

      <Dialog open={adding} onClose={() => setAdding(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={addFunds} noValidate>
          <DialogTitle>Adicionar saldo</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d,]/g, ''))}
              error={amount !== '' && !valid}
              helperText={amount !== '' && !valid ? 'Informe um valor entre R$ 0,01 e R$ 50.000,00.' : 'Crédito imediato via Pix.'}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> },
                htmlInput: { inputMode: 'decimal' }
              }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="inherit" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={!valid}>
              Adicionar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Panel>
  );
}
