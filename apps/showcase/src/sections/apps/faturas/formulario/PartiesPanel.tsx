// Painel de cliente e endereços.
import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Copy, Edit2, UserAdd } from 'iconsax-reactjs';
import { useFormContext, useWatch } from 'react-hook-form';
import { notify, Panel } from '@c3theme/ui';
import { Address, addressLine } from '../data';
import type { FormInput, FormOutput } from './schema';

function InfoCard({
  title,
  filled,
  error,
  actions,
  children
}: {
  title: string;
  filled: boolean;
  error?: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: 1,
        borderStyle: filled ? 'solid' : 'dashed',
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 2,
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1 }}>
        {children}
        {error && <FormHelperText error>{error}</FormHelperText>}
      </Box>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        {actions}
      </Stack>
    </Box>
  );
}

function AddressText({ address }: { address?: Address }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {address?.street ? addressLine(address) : 'Selecione o cliente para preencher.'}
    </Typography>
  );
}

/** Cliente e endereços de cobrança e entrega. */
export function PartiesPanel({
  onPickCustomer,
  onEditAddress
}: {
  onPickCustomer: () => void;
  onEditAddress: (which: 'billing' | 'shipping') => void;
}) {
  const {
    control,
    setValue,
    getValues,
    formState: { errors }
  } = useFormContext<FormInput, unknown, FormOutput>();
  const [customer, billing, shipping] = useWatch({ control, name: ['customer', 'billing', 'shipping'] });
  return (
    <>
      <Panel title="Cliente e endereços">
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoCard
              title="Cliente"
              filled={!!customer}
              error={errors.customer?.message}
              actions={
                <Button size="small" variant="outlined" startIcon={<UserAdd size={16} />} onClick={onPickCustomer}>
                  {customer ? 'Trocar cliente' : 'Selecionar cliente'}
                </Button>
              }
            >
              {customer ? (
                <>
                  <Typography variant="subtitle2">{customer.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.document}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {customer.email} · {customer.phone}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum cliente selecionado.
                </Typography>
              )}
            </InfoCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoCard
              title="Endereço de cobrança"
              filled={!!billing?.street}
              actions={
                <Button size="small" startIcon={<Edit2 size={16} />} disabled={!customer} onClick={() => onEditAddress('billing')}>
                  Editar
                </Button>
              }
            >
              <AddressText address={billing} />
            </InfoCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoCard
              title="Endereço de entrega"
              filled={!!shipping?.street}
              actions={
                <>
                  <Button size="small" startIcon={<Edit2 size={16} />} disabled={!customer} onClick={() => onEditAddress('shipping')}>
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<Copy size={16} />}
                    disabled={!customer}
                    onClick={() => {
                      setValue('shipping', getValues('billing'), { shouldDirty: true });
                      notify('Endereço de entrega igual ao de cobrança.', 'info');
                    }}
                  >
                    Usar o de cobrança
                  </Button>
                </>
              }
            >
              <AddressText address={shipping} />
            </InfoCard>
          </Grid>
        </Grid>
      </Panel>
    </>
  );
}
