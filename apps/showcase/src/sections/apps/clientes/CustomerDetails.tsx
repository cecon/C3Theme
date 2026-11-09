import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Call, Location, Personalcard, Sms } from 'iconsax-reactjs';

import { SoftAvatar, StatusChip } from '@c3theme/ui';
import { brl, Customer, formatCpf, formatPhone, initials, STATUS } from './data';

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', minWidth: 0 }}>
      <SoftAvatar size="sm" tone="secondary">
        {icon}
      </SoftAvatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <Typography variant="h5">{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/** Contato, números e observações do cliente. Usado na linha expandida da tabela e no diálogo de detalhes. */
export function CustomerSummary({ customer, compact }: { customer: Customer; compact?: boolean }) {
  const info = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: compact ? 3 : 6 }}>
        <Info icon={<Sms size={16} />} label="E-mail" value={customer.email} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: compact ? 3 : 6 }}>
        <Info icon={<Call size={16} />} label="Telefone" value={formatPhone(customer.telefone)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: compact ? 3 : 6 }}>
        <Info icon={<Personalcard size={16} />} label="CPF" value={formatCpf(customer.cpf)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: compact ? 3 : 6 }}>
        <Info icon={<Location size={16} />} label="Cidade" value={`${customer.cidade} - ${customer.uf}`} />
      </Grid>
    </Grid>
  );
  const stats = (
    <Stack
      direction="row"
      divider={<Divider orientation="vertical" flexItem />}
      sx={{ gap: 1, py: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}
    >
      <Stat label="Pedidos" value={String(customer.pedidos)} />
      <Stat label="Total gasto" value={brl.format(customer.totalGasto)} />
      <Stat label="Cliente desde" value={format(new Date(customer.desde), 'MMM/yyyy', { locale: ptBR })} />
    </Stack>
  );
  return (
    <Stack sx={{ gap: 2.5 }}>
      {compact ? (
        <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, lg: 8 }}>{info}</Grid>
          <Grid size={{ xs: 12, lg: 4 }}>{stats}</Grid>
        </Grid>
      ) : (
        <>
          {stats}
          {info}
        </>
      )}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Observações
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {customer.sobre || 'Nenhuma observação.'}
        </Typography>
      </Box>
      {customer.interesses.length > 0 && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {customer.interesses.map((i) => (
            <Chip key={i} label={i} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

interface Props {
  customer?: Customer;
  onClose: () => void;
  onEdit: (c: Customer) => void;
}

export default function CustomerDetailsDialog({ customer, onClose, onEdit }: Props) {
  return (
    <Dialog open={!!customer} onClose={onClose} maxWidth="sm" fullWidth aria-label="Detalhes do cliente">
      {customer && (
        <>
          <DialogContent>
            <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 1, mb: 3 }}>
              <SoftAvatar size="xl" src={customer.foto} alt={customer.nome} sx={{ width: 88, height: 88 }}>
                {initials(customer.nome)}
              </SoftAvatar>
              <Typography variant="h4">{customer.nome}</Typography>
              <Typography variant="body2" color="text.secondary">
                {customer.cargo} · {customer.idade} anos
              </Typography>
              <StatusChip label={STATUS[customer.status].label} tone={STATUS[customer.status].tone} />
            </Stack>
            <CustomerSummary customer={customer} />
            <Stack direction="row" sx={{ mt: 2.5, gap: 1, alignItems: 'center', color: 'text.secondary' }}>
              <Calendar size={16} />
              <Typography variant="caption">
                Cadastrado em {format(new Date(customer.desde), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Typography>
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button color="secondary" onClick={onClose}>
              Fechar
            </Button>
            <Button variant="contained" onClick={() => onEdit(customer)}>
              Editar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
