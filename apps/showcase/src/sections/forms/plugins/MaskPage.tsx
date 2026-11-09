import { useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

// third-party
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';
import { format, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NumberFormatValues, NumericFormat, PatternFormat } from 'react-number-format';

import { Panel } from '@c3theme/ui';

// ---------- dígitos verificadores ----------

function cpfValido(d: string) {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjValido(d: string) {
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const dv = (len: number) => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = pesos.reduce((acc, p, i) => acc + Number(d[i]) * p, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

// ---------- campo com máscara e o valor limpo embaixo ----------

interface PatternDemoProps {
  label: string;
  format: string | ((digits: string) => string);
  initial?: string;
  /** Mensagem de erro para o valor completo, ou `null` se estiver certo. */
  check?: (digits: string) => string | null;
  /** Quantidade de dígitos que forma um valor completo. */
  full?: number;
}

function PatternDemo({ label, format: fmt, initial = '', check, full }: PatternDemoProps) {
  const [v, setV] = useState<NumberFormatValues>({ value: initial, formattedValue: '', floatValue: undefined });
  const digits = v.value;
  const complete = full ? digits.length >= full : digits.length > 0;
  const error = complete && check ? check(digits) : null;
  const helper =
    error ?? (digits ? `Valor limpo: ${digits}${complete && check ? ' · válido' : ''}` : 'Só números; a pontuação entra sozinha.');

  return (
    <PatternFormat
      customInput={TextField}
      label={label}
      format={typeof fmt === 'string' ? fmt : fmt(digits)}
      mask="_"
      allowEmptyFormatting={false}
      value={digits}
      valueIsNumericString
      onValueChange={setV}
      error={!!error}
      helperText={helper}
      fullWidth
      slotProps={{
        htmlInput: { inputMode: 'numeric' },
        formHelperText: { sx: { color: complete && check && !error ? 'success.main' : undefined } }
      }}
    />
  );
}

function DataDigitada() {
  const [v, setV] = useState('');
  const digits = v.replace(/\D/g, '');
  const data = digits.length === 8 ? parse(v, 'dd/MM/yyyy', new Date()) : null;
  const invalida = data !== null && !isValid(data);
  return (
    <PatternFormat
      customInput={TextField}
      label="Data (DD/MM/AAAA)"
      format="##/##/####"
      mask={['D', 'D', 'M', 'M', 'A', 'A', 'A', 'A']}
      value={v}
      onValueChange={(x) => setV(x.formattedValue)}
      error={invalida}
      helperText={
        invalida ? 'Data inexistente.' : data ? format(data, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Digite só os números.'
      }
      fullWidth
      slotProps={{ htmlInput: { inputMode: 'numeric' } }}
    />
  );
}

function Moeda() {
  const [v, setV] = useState<number | undefined>(1234.5);
  return (
    <NumericFormat
      customInput={TextField}
      label="Valor (R$)"
      value={v ?? ''}
      onValueChange={(x) => setV(x.floatValue)}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      prefix="R$ "
      allowNegative={false}
      helperText={v !== undefined ? `Número: ${v}` : 'Digite o valor.'}
      fullWidth
      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
    />
  );
}

function Percentual() {
  const [v, setV] = useState<number | undefined>(12.5);
  return (
    <NumericFormat
      customInput={TextField}
      label="Desconto (%)"
      value={v ?? ''}
      onValueChange={(x) => setV(x.floatValue)}
      isAllowed={(x) => x.floatValue === undefined || x.floatValue <= 100}
      decimalSeparator=","
      decimalScale={2}
      suffix=" %"
      allowNegative={false}
      helperText="De 0 a 100."
      fullWidth
      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
    />
  );
}

function Calendarios() {
  const [dia, setDia] = useState<Date | null>(new Date(2026, 9, 18));
  const [hora, setHora] = useState<Date | null>(new Date(2026, 9, 18, 14, 30));
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={ptBR}
      localeText={pickersPtBR.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DatePicker label="Data de entrega" value={dia} onChange={setDia} slotProps={{ textField: { fullWidth: true } }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TimePicker label="Horário" value={hora} onChange={setHora} slotProps={{ textField: { fullWidth: true } }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DateTimePicker label="Data e hora da reunião" value={hora} onChange={setHora} slotProps={{ textField: { fullWidth: true } }} />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
}

const telefone = (d: string) => (d.length > 10 ? '(##) #####-####' : '(##) ####-#####');

export default function MaskPage() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Documentos" subtitle="Com conferência dos dígitos verificadores">
          <Stack spacing={2.5}>
            <PatternDemo label="CPF" format="###.###.###-##" full={11} check={(d) => (cpfValido(d) ? null : 'CPF inválido.')} />
            <PatternDemo label="CNPJ" format="##.###.###/####-##" full={14} check={(d) => (cnpjValido(d) ? null : 'CNPJ inválido.')} />
            <PatternDemo label="CEP" format="#####-###" />
          </Stack>
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Contato e pagamento">
          <Stack spacing={2.5}>
            <PatternDemo label="Telefone fixo ou celular" format={telefone} />
            <PatternDemo label="Cartão de crédito" format="#### #### #### ####" />
            <PatternDemo label="Validade do cartão" format="##/##" />
          </Stack>
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Valores">
          <Stack spacing={2.5}>
            <Moeda />
            <Percentual />
          </Stack>
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Panel title="Datas e horários">
          <Stack spacing={2.5}>
            <DataDigitada />
            <PatternDemo label="Hora (HH:MM)" format="##:##" />
          </Stack>
        </Panel>
      </Grid>
      <Grid size={12}>
        <Panel title="Com calendário" subtitle="Seletores de data e hora com a máscara do idioma">
          <Calendarios />
        </Panel>
      </Grid>
    </Grid>
  );
}
