// material-ui
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';

import { useUiText } from '../../i18n';
import { srOnly } from './srOnly';

export interface WizardStepsProps {
  /** Nome curto de cada passo, na ordem. */
  labels: string[];
  /** Índice do passo atual (0 é o primeiro). Os anteriores aparecem como feitos. */
  active: number;
}

/** Indicador de passos do assistente: feito (com ✓), atual (destacado, `aria-current`) e a fazer. Só mostra, não navega. */
export default function WizardSteps({ labels, active }: WizardStepsProps) {
  const t = useUiText();
  return (
    <Box component="nav" aria-label={t('c3.wizard.steps')}>
      <Stepper activeStep={active} alternativeLabel component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {labels.map((label, i) => (
          <Step key={i} completed={i < active} component="li" aria-current={i === active ? 'step' : undefined}>
            <StepLabel>
              {i < active ? (
                <>
                  <span aria-hidden>{label}</span>
                  <Box component="span" sx={srOnly}>
                    {t('c3.wizard.done', { label })}
                  </Box>
                </>
              ) : (
                label
              )}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
