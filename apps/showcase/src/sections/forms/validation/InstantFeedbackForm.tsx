// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

// third-party
import { zodResolver } from '@hookform/resolvers/zod';
import { CloseCircle, TickCircle } from 'iconsax-reactjs';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { notify, Panel, PasswordStrength } from '@c3theme/ui';

const schema = z
  .object({
    usuario: z
      .string()
      .min(3, 'Use pelo menos 3 caracteres.')
      .max(20, 'Use no máximo 20 caracteres.')
      .regex(/^[a-z0-9._]+$/, 'Só letras minúsculas, números, ponto e sublinhado.'),
    email: z.email('E-mail inválido.'),
    senha: z.string().min(8, 'Mínimo de 8 caracteres.').regex(/[A-Z]/, 'Inclua uma letra maiúscula.').regex(/[0-9]/, 'Inclua um número.'),
    confirmacao: z.string().min(1, 'Repita a senha.')
  })
  .refine((v) => v.senha === v.confirmacao, { path: ['confirmacao'], message: 'As senhas não conferem.' });

type Values = z.infer<typeof schema>;

/** Ícone de certo/errado ao lado do campo, só depois que o usuário mexeu nele. */
function Status({ touched, invalid }: { touched: boolean; invalid: boolean }) {
  if (!touched) return null;
  return (
    <InputAdornment position="end">
      {invalid ? (
        <CloseCircle size={18} color="currentColor" aria-label="Inválido" />
      ) : (
        <TickCircle size={18} variant="Bold" color="currentColor" aria-label="Válido" />
      )}
    </InputAdornment>
  );
}

export default function InstantFeedbackForm() {
  const { register, handleSubmit, reset, control, getFieldState, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { usuario: '', email: '', senha: '', confirmacao: '' }
  });
  const senha = useWatch({ control, name: 'senha' });

  const field = (name: keyof Values, label: string, type = 'text') => {
    const st = getFieldState(name, formState);
    const touched = st.isDirty || st.isTouched;
    const error = touched ? st.error : undefined;
    return (
      <TextField
        label={label}
        type={type}
        autoComplete={type === 'password' ? 'new-password' : undefined}
        {...register(name, name === 'senha' ? { deps: ['confirmacao'] } : undefined)}
        error={!!error}
        helperText={error?.message ?? (touched ? 'Tudo certo.' : ' ')}
        fullWidth
        slotProps={{
          input: { endAdornment: <Status touched={touched} invalid={!!error} /> },
          formHelperText: { sx: { color: touched && !error ? 'success.main' : undefined } }
        }}
        sx={{ '& .MuiInputAdornment-root': { color: error ? 'error.main' : 'success.main' } }}
      />
    );
  };

  return (
    <Panel title="Feedback instantâneo" subtitle="Cada campo é conferido enquanto você digita">
      <form
        noValidate
        onSubmit={handleSubmit(() => {
          notify('Conta criada.');
          reset();
        })}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{field('usuario', 'Nome de usuário')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{field('email', 'E-mail', 'email')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {field('senha', 'Senha', 'password')}
            {senha && <PasswordStrength password={senha} />}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>{field('confirmacao', 'Confirmar senha', 'password')}</Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
          <Button color="secondary" onClick={() => reset()}>
            Limpar
          </Button>
          <Button type="submit" variant="contained" disabled={!formState.isValid}>
            Criar conta
          </Button>
        </Stack>
      </form>
    </Panel>
  );
}
