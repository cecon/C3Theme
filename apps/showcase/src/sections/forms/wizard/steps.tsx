// material-ui
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Control, Controller, FieldPath } from 'react-hook-form';

import { FRETE, ITENS_PEDIDO, UFS } from '../data';
import { MaskedField } from '../shared';
import type { Pedido } from './schema';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface StepProps {
  control: Control<Pedido>;
}

type TextName = Exclude<FieldPath<Pedido>, 'principal' | 'salvarCartao'>;

function Text({
  control,
  name,
  label,
  mask,
  select
}: StepProps & { name: TextName; label: string; mask?: string; select?: readonly string[] }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const common = { label, fullWidth: true, error: !!fieldState.error, helperText: fieldState.error?.message, onBlur: field.onBlur };
        if (mask) return <MaskedField {...common} name={field.name} format={mask} value={field.value} onValueChange={field.onChange} />;
        return (
          <TextField {...common} {...field} select={!!select}>
            {select?.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </TextField>
        );
      }}
    />
  );
}

function Check({ control, name, label }: StepProps & { name: 'principal' | 'salvarCartao'; label: string }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label={label} />
      )}
    />
  );
}

export function AddressStep({ control }: StepProps) {
  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Text control={control} name="nome" label="Nome" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Text control={control} name="sobrenome" label="Sobrenome" />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Text control={control} name="cep" label="CEP" mask="#####-###" />
      </Grid>
      <Grid size={{ xs: 12, sm: 8 }}>
        <Text control={control} name="logradouro" label="Rua e número" />
      </Grid>
      <Grid size={12}>
        <Text control={control} name="complemento" label="Complemento (opcional)" />
      </Grid>
      <Grid size={{ xs: 8, sm: 8 }}>
        <Text control={control} name="cidade" label="Cidade" />
      </Grid>
      <Grid size={{ xs: 4, sm: 4 }}>
        <Text control={control} name="uf" label="UF" select={UFS} />
      </Grid>
      <Grid size={12}>
        <Check control={control} name="principal" label="Usar como endereço principal" />
      </Grid>
    </Grid>
  );
}

export function PaymentStep({ control }: StepProps) {
  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Text control={control} name="titular" label="Nome no cartão" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Text control={control} name="cartao" label="Número do cartão" mask="#### #### #### ####" />
      </Grid>
      <Grid size={{ xs: 6, sm: 6 }}>
        <Text control={control} name="validade" label="Validade (MM/AA)" mask="##/##" />
      </Grid>
      <Grid size={{ xs: 6, sm: 6 }}>
        <Text control={control} name="cvv" label="CVV" mask="###" />
      </Grid>
      <Grid size={12}>
        <Check control={control} name="salvarCartao" label="Lembrar este cartão nas próximas compras" />
      </Grid>
    </Grid>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 0.5 }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} color={strong ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'}>{value}</Typography>
    </Stack>
  );
}

export function ReviewStep({ values }: { values: Pedido }) {
  const subtotal = ITENS_PEDIDO.reduce((s, i) => s + i.preco * i.qtd, 0);
  const final4 = values.cartao.replace(/\D/g, '').slice(-4);
  return (
    <Stack spacing={2}>
      <Box>
        {ITENS_PEDIDO.map((i) => (
          <Stack key={i.nome} direction="row" sx={{ justifyContent: 'space-between', gap: 2, py: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">
                {i.qtd}× {i.nome}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {i.detalhe}
              </Typography>
            </Box>
            <Typography variant="body2">{brl.format(i.preco * i.qtd)}</Typography>
          </Stack>
        ))}
        <Divider sx={{ my: 1 }} />
        <Line label="Subtotal" value={brl.format(subtotal)} />
        <Line label="Frete" value={brl.format(FRETE)} />
        <Line label="Total" value={brl.format(subtotal + FRETE)} strong />
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Entrega
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[values.nome, values.sobrenome].filter(Boolean).join(' ') || 'Sem nome'}
            <br />
            {values.logradouro || 'Endereço não informado'}
            {values.complemento && `, ${values.complemento}`}
            <br />
            {[values.cidade, values.uf].filter(Boolean).join(' - ')} {values.cep && `· CEP ${values.cep}`}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="subtitle2" gutterBottom>
            Pagamento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {values.titular || 'Titular não informado'}
            <br />
            {final4 ? `Cartão final ${final4}` : 'Cartão não informado'}
            {values.validade && ` · validade ${values.validade}`}
          </Typography>
        </Grid>
      </Grid>
    </Stack>
  );
}
