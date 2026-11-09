// Dados pessoais do perfil.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { z } from 'zod';
import { notify } from '@c3theme/ui';
import { Profile, useProfile } from '../data';

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- dados pessoais

const personalSchema = z.object({
  firstName: z.string().trim().min(1, 'Informe o nome.'),
  lastName: z.string().trim().min(1, 'Informe o sobrenome.'),
  email: z.email('E-mail inválido.'),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone incompleto.'),
  cpf: z.string().regex(/^(\d{3}\.\d{3}\.\d{3}-\d{2})?$/, 'CPF incompleto.'),
  birthDate: z.string().regex(/^(\d{2}\/\d{2}\/\d{4})?$/, 'Use dd/mm/aaaa.'),
  jobTitle: z.string().trim(),
  address: z.string().trim(),
  city: z.string().trim(),
  state: z.string().regex(/^([A-Za-z]{2})?$/, 'Use 2 letras.'),
  zip: z.string().regex(/^(\d{5}-\d{3})?$/, 'CEP incompleto.'),
  website: z.union([z.literal(''), z.url('Endereço inválido (comece com https://).')]),
  bio: z.string().max(300, 'Até 300 caracteres.')
});

type MaskedKey = 'phone' | 'cpf' | 'birthDate' | 'zip';
const MASKS: Record<MaskedKey, string> = { phone: '(##) #####-####', cpf: '###.###.###-##', birthDate: '##/##/####', zip: '#####-###' };

/** Dados pessoais do perfil (compartilhado entre a página do usuário e a da conta). */
export function PersonalForm() {
  const [profile, setProfile] = useProfile();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<Profile>({ resolver: zodResolver(personalSchema), defaultValues: profile, mode: 'onTouched' });

  const onSubmit = async (v: Profile) => {
    await wait(500);
    const next = { ...v, state: v.state.toUpperCase() };
    setProfile(next);
    reset(next);
    notify('Dados pessoais salvos.');
  };

  const text = (key: keyof Profile, label: string, props: TextFieldProps = {}) => (
    <TextField label={label} fullWidth {...register(key)} error={!!errors[key]} helperText={errors[key]?.message} {...props} />
  );
  const masked = (key: MaskedKey, label: string, required = false) => (
    <Controller
      control={control}
      name={key}
      render={({ field, fieldState }) => (
        <PatternFormat
          format={MASKS[key]}
          customInput={TextField}
          label={label}
          required={required}
          fullWidth
          value={field.value}
          onValueChange={(v) => field.onChange(v.value ? v.formattedValue : '')}
          onBlur={field.onBlur}
          inputRef={field.ref}
          inputMode="numeric"
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Identificação
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>{text('firstName', 'Nome', { required: true, autoComplete: 'given-name' })}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{text('lastName', 'Sobrenome', { required: true, autoComplete: 'family-name' })}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{masked('cpf', 'CPF')}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{masked('birthDate', 'Data de nascimento')}</Grid>
        <Grid size={{ xs: 12 }}>{text('jobTitle', 'Cargo', { autoComplete: 'organization-title' })}</Grid>
      </Grid>
      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Contato e endereço
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>{text('email', 'E-mail', { required: true, type: 'email', autoComplete: 'email' })}</Grid>
        <Grid size={{ xs: 12, sm: 6 }}>{masked('phone', 'Celular', true)}</Grid>
        <Grid size={{ xs: 12 }}>{text('address', 'Endereço', { autoComplete: 'street-address' })}</Grid>
        <Grid size={{ xs: 12, sm: 5 }}>{text('city', 'Cidade', { autoComplete: 'address-level2' })}</Grid>
        <Grid size={{ xs: 4, sm: 2 }}>{text('state', 'UF', { slotProps: { htmlInput: { maxLength: 2 } } })}</Grid>
        <Grid size={{ xs: 8, sm: 5 }}>{masked('zip', 'CEP')}</Grid>
        <Grid size={{ xs: 12 }}>{text('website', 'Site ou portfólio', { placeholder: 'https://', type: 'url' })}</Grid>
        <Grid size={{ xs: 12 }}>
          {text('bio', 'Sobre você', {
            multiline: true,
            minRows: 3,
            helperText: errors.bio?.message ?? 'Aparece no seu perfil público (até 300 caracteres).'
          })}
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', mt: 3 }}>
        <Button color="inherit" disabled={!isDirty} onClick={() => reset(profile)}>
          Descartar
        </Button>
        <Button type="submit" variant="contained" loading={isSubmitting}>
          Salvar dados
        </Button>
      </Stack>
    </Box>
  );
}
