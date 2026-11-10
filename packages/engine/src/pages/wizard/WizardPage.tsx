// Página `wizard` do app.json (#34): os passos sobre o registro único da entidade, com Voltar, Avançar e Pular (passo
// opcional), e o resumo no fim, com o que falta e o link de cada item. A guarda fica em WizardGuard.
import { useState } from 'react';
import { useNavigate } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';

import { FormSkeleton, Wizard } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import useLookups from '../../hooks/useLookups';
import type { EntityDef, WireRecord } from '../../types';
import type { WizardDef } from '../../wizard';
import FormSection from '../FormSection';
import WizardSummary from './WizardSummary';
import { useSingletonRecord } from './useSingletonRecord';
import { useWizardStep } from './useWizardStep';

export default function WizardPage({ wizard }: { wizard: WizardDef }) {
  const { entities } = useEngine();
  const entry = entities[wizard.entity];
  const { record, loaded, error, reload } = useSingletonRecord(entry ? wizard.entity : undefined);
  if (!entry) return <Alert severity="warning">{`O assistente usa a entidade '${wizard.entity}', que não está em app.entities.`}</Alert>;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!loaded) return <FormSkeleton />;
  return <Steps wizard={wizard} def={entry.def} saved={record} reload={reload} />;
}

function Steps({ wizard, def, saved, reload }: { wizard: WizardDef; def: EntityDef; saved?: WireRecord; reload: () => Promise<unknown> }) {
  const text = useText();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const form = useWizardStep(def, saved, reload);
  const lookup = useLookups(def, form.record, true, (values) => Object.entries(values).forEach(([k, v]) => form.change(k, v)));
  const labels = [...wizard.steps.map((s) => ({ label: text(s.title) })), ...(wizard.summary ? [{ label: 'Resumo' }] : [])];
  const current = wizard.steps[step];
  const done = () => navigate('/', { replace: true });

  if (!current) {
    const pending = Boolean(wizard.pending && saved?.[wizard.pending] === true);
    return (
      <Wizard
        steps={labels}
        step={step}
        onStepChange={setStep}
        title={text(wizard.summary?.title ?? 'Tudo pronto')}
        description={wizard.summary?.description ? text(wizard.summary.description) : undefined}
        primary={{ label: 'Concluir', onClick: done, disabled: pending }}
      >
        <WizardSummary items={wizard.summary?.items ?? []} record={saved} pending={pending} />
      </Wizard>
    );
  }

  const last = step === wizard.steps.length - 1;
  const next = async () => {
    if (!(await form.save(current))) return;
    if (last && !wizard.summary) done();
    else setStep(step + 1);
  };
  return (
    <Wizard
      steps={labels}
      step={step}
      onStepChange={setStep}
      title={text(current.title)}
      description={current.description ? text(current.description) : undefined}
      error={form.formError}
      primary={{ label: last && !wizard.summary ? 'Concluir' : 'Avançar', onClick: () => void next(), disabled: form.busy }}
      secondary={current.optional ? { label: 'Pular', onClick: () => setStep(step + 1), disabled: form.busy } : undefined}
    >
      <FormSection
        section={{ rows: current.rows }}
        ctx={{
          def,
          record: form.record,
          errors: form.errors,
          editing: true,
          id: saved?.id ? String(saved.id) : undefined,
          flat: true,
          visible: form.visible,
          required: form.required,
          locked: form.locked,
          change: form.change,
          onRows: () => {},
          lookup
        }}
      />
    </Wizard>
  );
}
