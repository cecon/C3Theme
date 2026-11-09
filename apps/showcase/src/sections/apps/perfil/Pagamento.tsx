import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Add } from 'iconsax-reactjs';
import { notify, ScrollX } from '@c3theme/ui';
import ConfirmDialog from '../faturas/ConfirmDialog';
import { CARDS, CHARGES, SavedCard } from './data';
import { CardTile } from './pagamento/CardTile';
import { AddCardDialog } from './pagamento/AddCardDialog';

/** Cartões salvos e últimas cobranças. */
export default function PaymentTab() {
  const [cards, setCards] = useState(CARDS);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<SavedCard | null>(null);

  const makePrimary = (id: string) => setCards((list) => list.map((c) => ({ ...c, primary: c.id === id })));

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1">Cartões salvos</Typography>
          <Typography variant="body2" color="text.secondary">
            O cartão principal é usado nas cobranças da assinatura.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add size={18} />} onClick={() => setAdding(true)} sx={{ flexShrink: 0 }}>
          Adicionar
        </Button>
      </Stack>
      <Grid container spacing={2.5}>
        {cards.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, xl: 4 }}>
            <CardTile
              card={c}
              onPrimary={() => {
                makePrimary(c.id);
                notify(`Cartão final ${c.last4} agora é o principal.`);
              }}
              onRemove={() => setRemoving(c)}
            />
          </Grid>
        ))}
        {cards.length === 0 && (
          <Grid size={12}>
            <Typography color="text.secondary">Nenhum cartão salvo.</Typography>
          </Grid>
        )}
      </Grid>
      <Divider />
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Últimas cobranças
        </Typography>
        <ScrollX>
          <Table size="small" sx={{ minWidth: 480 }} aria-label="Últimas cobranças">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Cartão</TableCell>
                <TableCell align="right">Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CHARGES.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.date}</TableCell>
                  <TableCell>{h.description}</TableCell>
                  <TableCell>{h.card}</TableCell>
                  <TableCell align="right">{h.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollX>
      </Box>

      <AddCardDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(card) => {
          setCards((list) => {
            const next = card.primary || list.length === 0 ? list.map((c) => ({ ...c, primary: false })) : list;
            return [...next, { ...card, primary: card.primary || list.length === 0 }];
          });
          notify(`Cartão ${card.brand} final ${card.last4} adicionado.`);
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        title="Remover cartão?"
        description={removing ? `O cartão ${removing.brand} final ${removing.last4} deixará de ser usado nas cobranças.` : undefined}
        confirmLabel="Remover"
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          setCards((list) => {
            const rest = list.filter((c) => c.id !== removing.id);
            // se o principal saiu, o primeiro que sobrou assume
            return removing.primary && rest.length ? rest.map((c, i) => ({ ...c, primary: i === 0 })) : rest;
          });
          notify('Cartão removido.');
        }}
      />
    </Stack>
  );
}
