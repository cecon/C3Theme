import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';

// third-party
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft2, ArrowRight2, TickCircle } from 'iconsax-reactjs';
import { useForm } from 'react-hook-form';

import { MessagePage, notify, Panel, SoftAvatar } from '@c3theme/ui';
import { CAMPOS_POR_ETAPA, Pedido, PEDIDO_VAZIO, pedidoSchema } from './schema';
import { AddressStep, PaymentStep, ReviewStep } from './steps';

const ETAPAS = ['Endereço', 'Pagamento', 'Revisão'];

interface OrderWizardProps {
  title: string;
  subtitle: string;
  /** Confere os campos de cada etapa antes de avançar. Sem isso, o usuário pula livremente entre as etapas. */
  validated?: boolean;
}

export default function OrderWizard({ title, subtitle, validated = false }: OrderWizardProps) {
  const [step, setStep] = useState(0);
  const [pedidos, setPedidos] = useState(0);
  const { control, trigger, getValues, reset, formState } = useForm<Pedido>({
    resolver: validated ? zodResolver(pedidoSchema) : undefined,
    defaultValues: PEDIDO_VAZIO,
    mode: 'onTouched'
  });
  const done = step === ETAPAS.length;

  const next = async () => {
    if (validated && !(await trigger(CAMPOS_POR_ETAPA[step], { shouldFocus: true }))) {
      notify('Corrija os campos destacados para continuar.', 'warning');
      return;
    }
    if (step === ETAPAS.length - 1) {
      setPedidos((n) => n + 1);
      notify('Pedido confirmado.');
    }
    setStep((s) => s + 1);
  };

  const restart = () => {
    reset(PEDIDO_VAZIO);
    setStep(0);
  };

  // no assistente com validação, o selo de erro aparece na etapa já visitada que tem campo inválido
  const stepHasError = (i: number) => validated && CAMPOS_POR_ETAPA[i].some((f) => formState.errors[f]);

  return (
    <Panel title={title} subtitle={subtitle}>
      <Stepper activeStep={step} alternativeLabel nonLinear={!validated} sx={{ mb: 4 }}>
        {ETAPAS.map((label, i) => (
          <Step key={label} completed={done || (validated ? step > i : undefined)}>
            {validated ? (
              <StepLabel error={stepHasError(i)}>{label}</StepLabel>
            ) : (
              <StepButton onClick={() => !done && setStep(i)}>{label}</StepButton>
            )}
          </Step>
        ))}
      </Stepper>

      {done ? (
        <MessagePage
          icon={
            <SoftAvatar tone="success" size="xl">
              <TickCircle size={36} variant="Bold" />
            </SoftAvatar>
          }
          title="Pedido confirmado!"
          description={`Seu pedido nº ${String(48210 + pedidos)} foi registrado. Você receberá a confirmação por e-mail.`}
          action={
            <Button variant="contained" onClick={restart}>
              Fazer outro pedido
            </Button>
          }
        />
      ) : (
        <>
          <Box component="form" noValidate onSubmit={(e) => e.preventDefault()}>
            {step === 0 && <AddressStep control={control} />}
            {step === 1 && <PaymentStep control={control} />}
            {step === 2 && <ReviewStep values={getValues()} />}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 1 }}>
            <Button color="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)} startIcon={<ArrowLeft2 size={16} />}>
              Voltar
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', display: { xs: 'none', sm: 'block' } }}>
              Etapa {step + 1} de {ETAPAS.length}
            </Typography>
            <Button variant="contained" onClick={next} endIcon={step < ETAPAS.length - 1 ? <ArrowRight2 size={16} /> : undefined}>
              {step === ETAPAS.length - 1 ? 'Confirmar pedido' : 'Avançar'}
            </Button>
          </Box>
        </>
      )}
    </Panel>
  );
}
