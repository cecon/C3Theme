import { ReactNode, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, ReceiptText, ScanBarcode, ShieldTick } from 'iconsax-reactjs';
import { Controller, useForm } from 'react-hook-form';
import { PatternFormat } from 'react-number-format';
import { z } from 'zod';
import { Panel, SoftAvatar } from '@c3theme/ui';
import { brl } from '../data';
import { useStore } from '../store';
import { CopyField, FakeQr } from './PixParts';

export type PaymentMethod = 'cartao' | 'pix' | 'boleto';

export const METHODS: Record<PaymentMethod, { nome: string; detalhe: string; icon: ReactNode }> = {
  cartao: { nome: 'Cartão de crédito', detalhe: 'Até 10× sem juros', icon: <Card size={22} variant="Bulk" /> },
  pix: { nome: 'Pix', detalhe: 'Aprovação na hora', icon: <ScanBarcode size={22} variant="Bulk" /> },
  boleto: { nome: 'Boleto', detalhe: 'Compensa em até 2 dias úteis', icon: <ReceiptText size={22} variant="Bulk" /> }
};

const cardSchema = z.object({
  numero: z.string().regex(/^\d{16}$/, 'Número incompleto.'),
  nome: z.string().trim().min(3, 'Como está impresso no cartão.'),
  validade: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\d{2}$/, 'Use MM/AA.')
    .refine((v) => {
      const end = new Date(2000 + Number(v.slice(2)), Number(v.slice(0, 2)), 1);
      return end > new Date();
    }, 'Cartão vencido.'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido.'),
  parcelas: z.number()
});
type CardValues = z.infer<typeof cardSchema>;

interface Props {
  method: PaymentMethod;
  onMethod: (m: PaymentMethod) => void;
  onBack: () => void;
  onPay: (detalhe: string) => void;
}

/** Etapa 3: forma de pagamento e finalização. */
export default function PaymentStep({ method, onMethod, onBack, onPay }: Props) {
  const { totals } = useStore();
  const [paying, setPaying] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { numero: '', nome: '', validade: '', cvv: '', parcelas: 1 }
  });

  const centavos = Math.round(totals.total * 100);
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136c3loja-${String(centavos).padStart(8, '0')}5204000053039865802BR5909C3 LOJA6009SAO PAULO`;
  const boleto = `23790.12345 60000.${String(centavos).padStart(6, '0').slice(-6)} 00000.000000 1 ${String(9900000000 + centavos).slice(-10)}`;

  async function pay(detalhe: string) {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900)); // simula a autorização
    setPaying(false);
    onPay(detalhe);
  }

  const submitCard = handleSubmit((v) =>
    pay(`Cartão final ${v.numero.slice(-4)} · ${v.parcelas}× de ${brl.format(totals.total / v.parcelas)}`)
  );

  return (
    <Panel title="Pagamento">
      <Stack sx={{ gap: 3 }}>
        <Grid container spacing={1.5} role="radiogroup" aria-label="Forma de pagamento">
          {(Object.keys(METHODS) as PaymentMethod[]).map((m) => {
            const on = m === method;
            return (
              <Grid key={m} size={{ xs: 12, sm: 4 }}>
                <ButtonBase
                  role="radio"
                  aria-checked={on}
                  onClick={() => onMethod(m)}
                  sx={(t) => ({
                    width: 1,
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: on ? 'primary.main' : 'divider',
                    boxShadow: on ? `inset 0 0 0 1px ${t.vars.palette.primary.main}` : 'none',
                    textAlign: 'start'
                  })}
                >
                  <SoftAvatar size="md" tone={on ? 'primary' : 'neutral'}>
                    {METHODS[m].icon}
                  </SoftAvatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2">{METHODS[m].nome}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {METHODS[m].detalhe}
                    </Typography>
                  </Box>
                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>

        {method === 'cartao' && (
          <Box component="form" id="form-cartao" onSubmit={submitCard} noValidate>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Controller
                  control={control}
                  name="numero"
                  render={({ field }) => (
                    <PatternFormat
                      customInput={TextField}
                      format="#### #### #### ####"
                      label="Número do cartão"
                      fullWidth
                      autoComplete="cc-number"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v.value)}
                      inputRef={field.ref}
                      error={!!errors.numero}
                      helperText={errors.numero?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Nome no cartão"
                  fullWidth
                  autoComplete="cc-name"
                  {...register('nome')}
                  error={!!errors.nome}
                  helperText={errors.nome?.message}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Controller
                  control={control}
                  name="validade"
                  render={({ field }) => (
                    <PatternFormat
                      customInput={TextField}
                      format="##/##"
                      mask={['M', 'M', 'A', 'A']}
                      label="Validade"
                      fullWidth
                      autoComplete="cc-exp"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v.value)}
                      inputRef={field.ref}
                      error={!!errors.validade}
                      helperText={errors.validade?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Controller
                  control={control}
                  name="cvv"
                  render={({ field }) => (
                    <PatternFormat
                      customInput={TextField}
                      format="####"
                      label="CVV"
                      fullWidth
                      autoComplete="cc-csc"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v.value)}
                      inputRef={field.ref}
                      error={!!errors.cvv}
                      helperText={errors.cvv?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Controller
                  control={control}
                  name="parcelas"
                  render={({ field }) => (
                    <TextField select label="Parcelas" fullWidth {...field} onChange={(e) => field.onChange(Number(e.target.value))}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <MenuItem key={n} value={n}>
                          {n}× de {brl.format(totals.total / n)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {method === 'pix' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 3, alignItems: 'center' }}>
            <FakeQr seed={pixCode} />
            <Stack sx={{ gap: 1.5, flex: 1, width: 1 }}>
              <Typography variant="subtitle1">Pague {brl.format(totals.total)} com Pix</Typography>
              <Typography variant="body2" color="text.secondary">
                Abra o app do seu banco, escolha pagar com Pix e leia o QR Code ou use o código abaixo. O código vale por 30 minutos.
              </Typography>
              <CopyField label="Pix copia e cola" value={pixCode} />
            </Stack>
          </Stack>
        )}

        {method === 'boleto' && (
          <Stack sx={{ gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              O boleto vence em 3 dias úteis. O pedido é separado depois da compensação, que leva até 2 dias úteis.
            </Typography>
            <CopyField label="Linha digitável" value={boleto} />
          </Stack>
        )}

        <Alert severity="info" icon={<ShieldTick size={20} />}>
          Ambiente de demonstração: nenhum pagamento é processado de verdade.
        </Alert>

        <Stack direction="row" sx={{ gap: 1.5, justifyContent: 'space-between' }}>
          <Button color="secondary" onClick={onBack}>
            Voltar
          </Button>
          {method === 'cartao' ? (
            <Button type="submit" form="form-cartao" variant="contained" size="large" loading={paying}>
              Pagar {brl.format(totals.total)}
            </Button>
          ) : (
            <Button variant="contained" size="large" loading={paying} onClick={() => pay(method === 'pix' ? 'Pix' : 'Boleto bancário')}>
              {method === 'pix' ? 'Já paguei' : 'Gerar boleto e finalizar'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Panel>
  );
}
