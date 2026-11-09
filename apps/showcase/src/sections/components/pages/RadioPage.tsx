import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { brl } from '../data';
import Example, { ExamplePage } from '../Example';

const COLORS = [
  { color: 'primary', label: 'Primária' },
  { color: 'secondary', label: 'Secundária' },
  { color: 'success', label: 'Sucesso' },
  { color: 'warning', label: 'Atenção' },
  { color: 'error', label: 'Erro' },
  { color: 'info', label: 'Informação' }
] as const;

const PLANS = [
  { id: 'basico', name: 'Básico', price: 49, text: 'Até 3 usuários' },
  { id: 'equipe', name: 'Equipe', price: 129, text: 'Até 15 usuários' },
  { id: 'empresa', name: 'Empresa', price: 349, text: 'Usuários ilimitados' }
];

function QuizDemo() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<{ error: boolean; text: string }>({ error: false, text: 'Escolha com cuidado.' });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value === 'brasilia') setResult({ error: false, text: 'Isso mesmo!' });
        else if (value) setResult({ error: true, text: 'Não é essa. Tente de novo.' });
        else setResult({ error: true, text: 'Escolha uma opção.' });
      }}
    >
      <FormControl error={result.error}>
        <FormLabel id="quiz">Qual é a capital do Brasil?</FormLabel>
        <RadioGroup aria-labelledby="quiz" value={value} onChange={(e) => setValue(e.target.value)}>
          <FormControlLabel value="rio" control={<Radio />} label="Rio de Janeiro" />
          <FormControlLabel value="brasilia" control={<Radio />} label="Brasília" />
          <FormControlLabel value="salvador" control={<Radio />} label="Salvador" />
        </RadioGroup>
        <FormHelperText>{result.text}</FormHelperText>
        <Button type="submit" variant="outlined" sx={{ mt: 1, alignSelf: 'flex-start' }}>
          Conferir
        </Button>
      </FormControl>
    </form>
  );
}

function PlanDemo() {
  const [plan, setPlan] = useState('equipe');
  return (
    <RadioGroup value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plano">
      <Stack spacing={1.5}>
        {PLANS.map((p) => (
          <Box
            key={p.id}
            component="label"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              border: 1,
              borderRadius: 2,
              cursor: 'pointer',
              borderColor: plan === p.id ? 'primary.main' : 'divider',
              bgcolor: plan === p.id ? 'action.selected' : 'transparent'
            }}
          >
            <Radio value={p.id} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1">{p.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {p.text}
              </Typography>
            </Box>
            <Typography variant="h5">
              {brl.format(p.price)}
              <Typography component="span" variant="caption" color="text.secondary">
                /mês
              </Typography>
            </Typography>
          </Box>
        ))}
      </Stack>
    </RadioGroup>
  );
}

export default function RadioPage() {
  return (
    <ExamplePage intro="Botões de opção escolhem exatamente uma alternativa de um conjunto pequeno, com todas as opções à vista.">
      <Example
        title="Básico"
        code={`<FormControl>
  <FormLabel id="entrega">Entrega</FormLabel>
  <RadioGroup aria-labelledby="entrega" defaultValue="retirar" name="entrega">
    <FormControlLabel value="retirar" control={<Radio />} label="Retirar na loja" />
    <FormControlLabel value="correios" control={<Radio />} label="Correios" />
  </RadioGroup>
</FormControl>`}
      >
        <FormControl>
          <FormLabel id="entrega">Forma de entrega</FormLabel>
          <RadioGroup aria-labelledby="entrega" defaultValue="retirar" name="entrega">
            <FormControlLabel value="retirar" control={<Radio />} label="Retirar na loja" />
            <FormControlLabel value="correios" control={<Radio />} label="Correios" />
            <FormControlLabel value="motoboy" control={<Radio />} label="Motoboy" />
            <FormControlLabel value="agendada" control={<Radio />} label="Entrega agendada (indisponível)" disabled />
          </RadioGroup>
        </FormControl>
      </Example>

      <Example title="Em linha" code={`<RadioGroup row defaultValue="pix">...</RadioGroup>`}>
        <FormControl>
          <FormLabel id="pagamento">Pagamento</FormLabel>
          <RadioGroup row aria-labelledby="pagamento" defaultValue="pix">
            <FormControlLabel value="pix" control={<Radio />} label="Pix" />
            <FormControlLabel value="boleto" control={<Radio />} label="Boleto" />
            <FormControlLabel value="cartao" control={<Radio />} label="Cartão" />
          </RadioGroup>
        </FormControl>
      </Example>

      <Example title="Cores" code={`<Radio color="success" />`}>
        <RadioGroup row defaultValue="primary" aria-label="Cores">
          {COLORS.map(({ color, label }) => (
            <FormControlLabel key={color} value={color} control={<Radio color={color} />} label={label} />
          ))}
        </RadioGroup>
      </Example>

      <Example
        title="Tamanhos"
        code={`<Radio size="small" />
<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />`}
      >
        <RadioGroup row defaultValue="m" aria-label="Tamanhos">
          <FormControlLabel value="p" control={<Radio size="small" />} label="Pequeno" />
          <FormControlLabel value="m" control={<Radio />} label="Médio" />
          <FormControlLabel value="g" control={<Radio sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} />} label="Grande" />
        </RadioGroup>
      </Example>

      <Example title="Posição do rótulo" code={`<FormControlLabel labelPlacement="top" control={<Radio />} label="Em cima" />`}>
        <RadioGroup row defaultValue="top" aria-label="Posição do rótulo" sx={{ gap: 1 }}>
          {(['top', 'start', 'bottom', 'end'] as const).map((placement) => (
            <FormControlLabel
              key={placement}
              value={placement}
              control={<Radio />}
              label={{ top: 'Em cima', start: 'Antes', bottom: 'Embaixo', end: 'Depois' }[placement]}
              labelPlacement={placement}
            />
          ))}
        </RadioGroup>
      </Example>

      <Example title="Com validação" code={`<FormControl error={erro}>...<FormHelperText>{mensagem}</FormHelperText></FormControl>`}>
        <QuizDemo />
      </Example>

      <Example
        title="Cartões de opção"
        description="Rótulo rico para escolher planos ou modalidades."
        code={`<RadioGroup value={plano}>
  <Box component="label" sx={{ border: 1, borderColor: ativo ? 'primary.main' : 'divider' }}>
    <Radio value="equipe" /> Equipe — R$ 129,00/mês
  </Box>
</RadioGroup>`}
        wide
      >
        <PlanDemo />
      </Example>
    </ExamplePage>
  );
}
