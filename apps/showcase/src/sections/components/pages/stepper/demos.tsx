// Etapas: linear, não linear e vertical.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepContent from '@mui/material/StepContent';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import { notify } from '@c3theme/ui';

const CHECKOUT = ['Carrinho', 'Entrega', 'Pagamento', 'Revisão'];

export function LinearDemo() {
  const [active, setActive] = useState(0);
  const [skipped, setSkipped] = useState<number[]>([]);
  const optional = (i: number) => i === 1;
  const horizontal = useMediaQuery((t: Theme) => t.breakpoints.up('sm'));

  const next = () => {
    setSkipped(skipped.filter((s) => s !== active));
    setActive((a) => a + 1);
  };
  const skip = () => {
    setSkipped([...skipped, active]);
    setActive((a) => a + 1);
  };

  return (
    <Stack spacing={3}>
      <Stepper activeStep={active} orientation={horizontal ? 'horizontal' : 'vertical'}>
        {CHECKOUT.map((label, i) => (
          <Step key={label} completed={skipped.includes(i) ? false : undefined}>
            <StepLabel optional={optional(i) ? <Typography variant="caption">Opcional</Typography> : undefined}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {active === CHECKOUT.length ? (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Typography>Pedido concluído! {skipped.length > 0 && 'Você pulou a etapa de entrega (retirada na loja).'}</Typography>
          <Button
            onClick={() => {
              setActive(0);
              setSkipped([]);
            }}
          >
            Recomeçar
          </Button>
        </Stack>
      ) : (
        <>
          <Typography color="text.secondary">
            Etapa {active + 1}: {CHECKOUT[active]}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button disabled={active === 0} onClick={() => setActive((a) => a - 1)}>
              Voltar
            </Button>
            <Box sx={{ flex: 1 }} />
            {optional(active) && <Button onClick={skip}>Pular</Button>}
            <Button variant="contained" onClick={next}>
              {active === CHECKOUT.length - 1 ? 'Finalizar' : 'Próxima'}
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}

const SETUP = ['Dados da empresa', 'Usuários', 'Integrações'];

export function NonLinearDemo() {
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const done = Object.values(completed).filter(Boolean).length;
  const complete = () => {
    const next = { ...completed, [active]: true };
    setCompleted(next);
    const pending = SETUP.findIndex((_, i) => !next[i]);
    if (pending >= 0) setActive(pending);
    else notify('Configuração concluída!');
  };
  return (
    <Stack spacing={3}>
      <Stepper nonLinear activeStep={active} alternativeLabel>
        {SETUP.map((label, i) => (
          <Step key={label} completed={completed[i]}>
            <StepButton color="inherit" onClick={() => setActive(i)}>
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <Typography color="text.secondary">
        {done} de {SETUP.length} concluídas. Clique em qualquer etapa para ir direto a ela.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={() => {
            setActive(0);
            setCompleted({});
          }}
        >
          Limpar
        </Button>
        <Button variant="contained" onClick={complete} disabled={completed[active]}>
          {completed[active] ? 'Etapa concluída' : 'Concluir etapa'}
        </Button>
      </Stack>
    </Stack>
  );
}

const VERTICAL = [
  { label: 'Escolha o plano', text: 'Compare os planos e selecione o que atende sua equipe.' },
  { label: 'Cadastre a empresa', text: 'Informe CNPJ, razão social e endereço de cobrança.' },
  { label: 'Convide a equipe', text: 'Envie convites por e-mail; cada pessoa define a própria senha.' }
];

export function VerticalDemo() {
  const [active, setActive] = useState(0);
  return (
    <Stepper activeStep={active} orientation="vertical">
      {VERTICAL.map((s, i) => (
        <Step key={s.label}>
          <StepLabel optional={i === 2 ? <Typography variant="caption">Última etapa</Typography> : undefined}>{s.label}</StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {s.text}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={() => setActive(i + 1)}>
                {i === VERTICAL.length - 1 ? 'Concluir' : 'Continuar'}
              </Button>
              <Button size="small" disabled={i === 0} onClick={() => setActive(i - 1)}>
                Voltar
              </Button>
            </Stack>
          </StepContent>
        </Step>
      ))}
      {active === VERTICAL.length && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography gutterBottom>Tudo pronto!</Typography>
          <Button size="small" onClick={() => setActive(0)}>
            Recomeçar
          </Button>
        </Paper>
      )}
    </Stepper>
  );
}
