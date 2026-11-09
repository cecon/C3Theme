import { useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { zodResolver } from '@hookform/resolvers/zod';
import { Call, Clock, Location, Sms, Whatsapp } from 'iconsax-reactjs';
import { Controller, useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { z } from 'zod';

import { notify, SoftAvatar, Tone } from '@c3theme/ui';
import { PublicFooter, PublicHeader } from './chrome';

const SUBJECTS = ['Quero contratar', 'Suporte técnico', 'Financeiro e cobrança', 'Parcerias', 'Outro assunto'];
const SIZES = ['Só eu', '2 a 10 pessoas', '11 a 50 pessoas', 'Mais de 50 pessoas'];

const schema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome.'),
  company: z.string().trim(),
  email: z.email('Informe um e-mail válido.'),
  phone: z.string().regex(/^(\(\d{2}\) \d{5}-\d{4})?$/, 'Telefone incompleto.'),
  subject: z.string().min(1, 'Escolha o assunto.'),
  size: z.string(),
  message: z.string().trim().min(20, 'Conte um pouco mais (mínimo de 20 caracteres).').max(1000, 'Até 1000 caracteres.'),
  consent: z.literal(true, { error: 'Precisamos do seu aceite para responder.' })
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

const CONTACTS: { icon: typeof Sms; tone: Tone; title: string; lines: string[] }[] = [
  { icon: Sms, tone: 'primary', title: 'E-mail', lines: ['contato@c3theme.dev', 'suporte@c3theme.dev'] },
  { icon: Call, tone: 'success', title: 'Telefone', lines: ['(11) 3456-7890', '0800 123 4567 (grátis)'] },
  { icon: Whatsapp, tone: 'info', title: 'WhatsApp', lines: ['(11) 98765-0000', 'Respostas em até 1 hora'] },
  { icon: Location, tone: 'warning', title: 'Escritório', lines: ['Av. Paulista, 1500, conj. 82', 'Bela Vista, São Paulo/SP'] },
  { icon: Clock, tone: 'secondary', title: 'Horário', lines: ['Segunda a sexta, 8h às 18h', 'Sábado, 9h às 13h'] }
];

const EMPTY: Partial<Input> = { name: '', company: '', email: '', phone: '', subject: '', size: SIZES[1], message: '' };

export default function ContactPage() {
  const [sentTo, setSentTo] = useState<string>();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<Input, unknown, Output>({ resolver: zodResolver(schema), defaultValues: EMPTY, mode: 'onTouched' });

  const onSubmit = async (v: Output) => {
    await new Promise((r) => setTimeout(r, 700));
    setSentTo(v.email);
    reset(EMPTY);
    notify('Mensagem enviada! Respondemos em até 1 dia útil.');
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <PublicHeader />
      <Box
        sx={(theme) => ({
          pt: { xs: 6, md: 10 },
          pb: { xs: 4, md: 6 },
          textAlign: 'center',
          backgroundImage: `radial-gradient(ellipse at top, rgb(${theme.vars.palette.primary.mainChannel} / 0.14), transparent 60%)`
        })}
      >
        <Container maxWidth="md">
          <Typography variant="overline" color="primary.main">
            Fale conosco
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
            Como podemos ajudar?
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Dúvida sobre planos, ajuda com a conta ou proposta de parceria: mande uma mensagem e uma pessoa de verdade responde.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Envie uma mensagem
              </Typography>
              {sentTo && (
                <Alert severity="success" onClose={() => setSentTo(undefined)} sx={{ mb: 3 }}>
                  Recebemos sua mensagem. A resposta vai para {sentTo}.
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nome"
                      required
                      fullWidth
                      autoComplete="name"
                      {...register('name')}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Empresa" fullWidth autoComplete="organization" {...register('company')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="E-mail"
                      type="email"
                      required
                      fullWidth
                      autoComplete="email"
                      {...register('email')}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <PatternFormat
                          format="(##) #####-####"
                          customInput={TextField}
                          label="Celular"
                          fullWidth
                          autoComplete="tel"
                          inputMode="tel"
                          value={field.value}
                          onValueChange={(v) => field.onChange(v.value ? v.formattedValue : '')}
                          onBlur={field.onBlur}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={control}
                      name="subject"
                      render={({ field, fieldState }) => (
                        <TextField
                          select
                          label="Assunto"
                          required
                          fullWidth
                          {...field}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        >
                          {SUBJECTS.map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={control}
                      name="size"
                      render={({ field }) => (
                        <TextField select label="Tamanho da empresa" fullWidth {...field}>
                          {SIZES.map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Mensagem"
                      required
                      multiline
                      minRows={5}
                      fullWidth
                      {...register('message')}
                      error={!!errors.message}
                      helperText={errors.message?.message}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name="consent"
                      render={({ field, fieldState }) => (
                        <>
                          <FormControlLabel
                            control={<Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                            label={
                              <Typography variant="body2">
                                Autorizo o uso dos meus dados para responder a este contato, conforme a LGPD.
                              </Typography>
                            }
                          />
                          {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
                        </>
                      )}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      loading={isSubmitting}
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                      Enviar mensagem
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2}>
              {CONTACTS.map(({ icon: Icon, tone, title, lines }) => (
                <Paper key={title} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={2}>
                    <SoftAvatar tone={tone} variant="rounded">
                      <Icon size={20} />
                    </SoftAvatar>
                    <Box>
                      <Typography variant="subtitle1">{title}</Typography>
                      {lines.map((l) => (
                        <Typography key={l} variant="body2" color="text.secondary">
                          {l}
                        </Typography>
                      ))}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
      <PublicFooter />
    </Box>
  );
}
