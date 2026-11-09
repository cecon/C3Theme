import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { MonthCalendar } from '@mui/x-date-pickers/MonthCalendar';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { YearCalendar } from '@mui/x-date-pickers/YearCalendar';

// third-party
import { addDays, differenceInCalendarDays, format, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Example, { ExamplePage } from '../Example';

// data fixa de referência para os exemplos não mudarem a cada dia
const BASE = new Date(2026, 9, 18, 14, 30);
const localeText = pickersPtBR.components.MuiLocalizationProvider.defaultProps.localeText;

function BasicDemo() {
  const [date, setDate] = useState<Date | null>(BASE);
  const [time, setTime] = useState<Date | null>(BASE);
  const [dateTime, setDateTime] = useState<Date | null>(BASE);
  return (
    <Stack spacing={2}>
      <DatePicker label="Data" value={date} onChange={setDate} />
      <TimePicker label="Hora" value={time} onChange={setTime} />
      <DateTimePicker label="Data e hora" value={dateTime} onChange={setDateTime} />
      <Typography variant="body2" color="text.secondary">
        {dateTime ? format(dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Sem data'}
      </Typography>
    </Stack>
  );
}

function RangeDemo() {
  const [start, setStart] = useState<Date | null>(BASE);
  const [end, setEnd] = useState<Date | null>(addDays(BASE, 5));
  const nights = start && end ? differenceInCalendarDays(end, start) : 0;
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <DatePicker label="Entrada" value={start} onChange={setStart} sx={{ flex: 1 }} />
        <DatePicker
          label="Saída"
          value={end}
          onChange={setEnd}
          minDate={start ?? undefined}
          sx={{ flex: 1 }}
          slotProps={{ textField: { helperText: start ? 'A partir da data de entrada' : undefined } }}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {nights > 0 ? `${nights} diária${nights > 1 ? 's' : ''}` : 'Escolha um período válido.'}
      </Typography>
    </Stack>
  );
}

function SubComponentsDemo() {
  const [date, setDate] = useState<Date | null>(BASE);
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, flexWrap: 'wrap' }}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <DateCalendar value={date} onChange={setDate} />
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TimeClock value={date} onChange={setDate} ampm={false} />
      </Box>
      <Stack spacing={2}>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, maxWidth: 320 }}>
          <MonthCalendar value={date} onChange={setDate} />
        </Box>
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, maxWidth: 320, maxHeight: 200, overflow: 'auto' }}>
          <YearCalendar value={date} onChange={setDate} />
        </Box>
      </Stack>
    </Stack>
  );
}

export default function DateTimePage() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR} localeText={localeText}>
      <ExamplePage intro="Seletores de data e hora do MUI X, em português e com o calendário começando no domingo. Envolva a página com LocalizationProvider usando date-fns e ptBR.">
        <Example
          title="Data, hora e data e hora"
          code={`<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
  <DatePicker label="Data" value={data} onChange={setData} />
  <TimePicker label="Hora" value={hora} onChange={setHora} />
  <DateTimePicker label="Data e hora" value={dataHora} onChange={setDataHora} />
</LocalizationProvider>`}
        >
          <BasicDemo />
        </Example>

        <Example
          title="Texto de ajuda e restrições"
          description="Mínimo, máximo e dias desabilitados."
          code={`<DatePicker label="Vencimento" minDate={hoje} maxDate={addDays(hoje, 60)} shouldDisableDate={isWeekend}
  slotProps={{ textField: { helperText: 'Somente dias úteis' } }} />`}
        >
          <Stack spacing={2}>
            <DatePicker
              label="Vencimento"
              defaultValue={addDays(BASE, 2)}
              minDate={BASE}
              maxDate={addDays(BASE, 60)}
              shouldDisableDate={isWeekend}
              slotProps={{ textField: { helperText: 'Somente dias úteis nos próximos 60 dias' } }}
            />
            <TimePicker
              label="Horário de atendimento"
              defaultValue={BASE}
              minTime={new Date(2026, 9, 18, 8)}
              maxTime={new Date(2026, 9, 18, 18)}
              slotProps={{ textField: { helperText: 'Entre 08:00 e 18:00' } }}
            />
            <DatePicker label="Ano e mês" views={['year', 'month']} openTo="month" defaultValue={BASE} />
          </Stack>
        </Example>

        <Example
          title="Desabilitado e somente leitura"
          code={`<DatePicker disabled ... />
<DatePicker readOnly ... />`}
        >
          <Stack spacing={2}>
            <DatePicker label="Desabilitado" defaultValue={BASE} disabled />
            <DatePicker label="Somente leitura" defaultValue={BASE} readOnly />
            <TimePicker label="Hora desabilitada" defaultValue={BASE} disabled />
            <MobileDatePicker label="Versão de celular (abre em diálogo)" defaultValue={BASE} />
          </Stack>
        </Example>

        <Example
          title="Período"
          description="Dois campos ligados: a saída não pode ser antes da entrada."
          code={`<DatePicker label="Entrada" value={inicio} onChange={setInicio} />
<DatePicker label="Saída" value={fim} onChange={setFim} minDate={inicio} />`}
        >
          <RangeDemo />
        </Example>

        <Example
          title="Calendário fixo"
          description="Sem campo; útil em painéis e agendas."
          code={`<StaticDatePicker defaultValue={hoje} />`}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <StaticDatePicker defaultValue={BASE} slotProps={{ actionBar: { actions: ['today'] } }} />
          </Box>
        </Example>

        <Example title="Paisagem" description="Cabeçalho ao lado do calendário." code={`<StaticDatePicker orientation="landscape" />`}>
          <Box sx={{ overflowX: 'auto' }}>
            <StaticDatePicker orientation="landscape" defaultValue={BASE} slotProps={{ actionBar: { actions: [] } }} />
          </Box>
        </Example>

        <Example
          title="Peças avulsas"
          description="Calendário, relógio, meses e anos usados separadamente."
          code={`<DateCalendar value={data} onChange={setData} />
<TimeClock value={data} onChange={setData} ampm={false} />
<MonthCalendar ... /> <YearCalendar ... />`}
          wide
        >
          <SubComponentsDemo />
        </Example>

        <Example
          title="Nativos do navegador"
          description="Campos type=date/time; aparência do sistema."
          code={`<TextField type="date" label="Data" />`}
        >
          <Stack spacing={2}>
            <TextField type="date" label="Data" defaultValue="2026-10-18" />
            <TextField type="time" label="Hora" defaultValue="14:30" />
            <TextField type="datetime-local" label="Data e hora" defaultValue="2026-10-18T14:30" />
          </Stack>
        </Example>
      </ExamplePage>
    </LocalizationProvider>
  );
}
