import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Add, Edit, Location, Trash } from 'iconsax-reactjs';
import { ConfirmDialog, notify, Panel } from '@c3theme/ui';
import { formatPhone } from '../../clientes/data';
import { Address, brl, formatCep, FREE_SHIPPING_FROM, SHIPPING, ShippingId } from '../data';
import { useStore } from '../store';
import { AddressDialog } from './AddressDialog';

export const addressLines = (a: Address) => [
  `${a.rua}, ${a.numero}${a.complemento ? ` - ${a.complemento}` : ''}`,
  `${a.bairro}, ${a.cidade} - ${a.uf}`,
  `CEP ${formatCep(a.cep)}`
];

interface Props {
  selected?: number;
  onSelect: (id?: number) => void;
}

/** Etapa 2: endereço de entrega (com cadastro) e modalidade de frete. */
export default function AddressStep({ selected, onSelect }: Props) {
  const { addresses, removeAddress, shipping, setShipping, totals, coupon } = useStore();
  const [dialog, setDialog] = useState<{ open: boolean; address?: Address }>({ open: false });
  const [deleting, setDeleting] = useState<Address>();
  const freeStandard = totals.subtotal >= FREE_SHIPPING_FROM || !!coupon?.freteGratis;

  return (
    <Stack sx={{ gap: 3 }}>
      <Panel
        title="Endereço de entrega"
        action={
          <Button size="small" startIcon={<Add size={16} />} onClick={() => setDialog({ open: true })}>
            Novo endereço
          </Button>
        }
      >
        <Grid container spacing={2} role="radiogroup" aria-label="Endereço de entrega">
          {addresses.map((a) => {
            const on = a.id === selected;
            return (
              <Grid key={a.id} size={{ xs: 12, sm: 6 }}>
                <Box sx={{ position: 'relative', height: 1 }}>
                  <ButtonBase
                    role="radio"
                    aria-checked={on}
                    onClick={() => onSelect(a.id)}
                    sx={(t) => ({
                      display: 'block',
                      textAlign: 'start',
                      width: 1,
                      height: 1,
                      p: 2,
                      pb: 6,
                      borderRadius: 2,
                      border: 1,
                      borderColor: on ? 'primary.main' : 'divider',
                      bgcolor: on ? `rgb(${t.vars.palette.primary.mainChannel} / 0.05)` : 'transparent',
                      boxShadow: on ? `inset 0 0 0 1px ${t.vars.palette.primary.main}` : 'none'
                    })}
                  >
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                      <Radio checked={on} size="small" tabIndex={-1} sx={{ p: 0 }} slotProps={{ input: { 'aria-hidden': true } }} />
                      <Typography variant="subtitle1">{a.apelido}</Typography>
                    </Stack>
                    <Typography variant="body2">{a.destinatario}</Typography>
                    {addressLines(a).map((l) => (
                      <Typography key={l} variant="body2" color="text.secondary">
                        {l}
                      </Typography>
                    ))}
                    <Typography variant="body2" color="text.secondary">
                      {formatPhone(a.telefone)}
                    </Typography>
                  </ButtonBase>
                  <Stack direction="row" sx={{ position: 'absolute', bottom: 8, insetInlineEnd: 8 }}>
                    <IconButton
                      size="small"
                      aria-label={`Editar endereço ${a.apelido}`}
                      onClick={() => setDialog({ open: true, address: a })}
                    >
                      <Edit size={16} />
                    </IconButton>
                    <IconButton size="small" color="error" aria-label={`Excluir endereço ${a.apelido}`} onClick={() => setDeleting(a)}>
                      <Trash size={16} />
                    </IconButton>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
          <Grid size={{ xs: 12, sm: 6 }}>
            <ButtonBase
              onClick={() => setDialog({ open: true })}
              sx={{
                width: 1,
                height: 1,
                minHeight: 160,
                borderRadius: 2,
                border: 1,
                borderStyle: 'dashed',
                borderColor: 'divider',
                flexDirection: 'column',
                gap: 1,
                color: 'text.secondary'
              }}
            >
              <Location size={28} />
              <Typography variant="subtitle2">Cadastrar endereço</Typography>
            </ButtonBase>
          </Grid>
        </Grid>
      </Panel>

      <Panel title="Entrega">
        <Stack sx={{ gap: 1.5 }} role="radiogroup" aria-label="Modalidade de entrega">
          {(Object.keys(SHIPPING) as ShippingId[]).map((id) => {
            const s = SHIPPING[id];
            const on = shipping === id;
            const free = id === 'padrao' && freeStandard;
            return (
              <ButtonBase
                key={id}
                role="radio"
                aria-checked={on}
                onClick={() => setShipping(id)}
                sx={{
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: on ? 'primary.main' : 'divider',
                  textAlign: 'start'
                }}
              >
                <Radio checked={on} size="small" tabIndex={-1} sx={{ p: 0 }} slotProps={{ input: { 'aria-hidden': true } }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{s.nome}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.prazo}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" color={free ? 'success.main' : 'text.primary'}>
                  {free ? 'Grátis' : brl.format(s.preco)}
                </Typography>
              </ButtonBase>
            );
          })}
        </Stack>
      </Panel>

      <AddressDialog
        open={dialog.open}
        address={dialog.address}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSaved={(a) => onSelect(a.id)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Excluir endereço?"
        description={deleting && `O endereço "${deleting.apelido}" será removido.`}
        onClose={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return;
          removeAddress(deleting.id);
          if (selected === deleting.id) onSelect(undefined);
          notify('Endereço excluído.');
        }}
      />
    </Stack>
  );
}
