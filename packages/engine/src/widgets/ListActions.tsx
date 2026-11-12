import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';

import { ActionDialog, notify } from '@c3theme/ui';
import { iconByName, useEngine, useText } from '../context';
import useAction from '../hooks/useAction';
import useActionInput from '../hooks/useActionInput';
import useGridFullScreen from '../hooks/useGridFullScreen';
import useActionReply from '../hooks/useActionReply';
import useStepsRun from '../hooks/useStepsRun';
import useTaskTelemetry from '../hooks/useTaskTelemetry';
import ActionBody from './ActionBody';
import StepsDialog from './StepsDialog';
import { loadPrefill } from './prefill';
import type { ActionDef } from '../types';
import { runsAtOnce } from '../actionTypes';

/**
 * Botões das ações da lista (`target: list`: importar, aplicar modelo) que o usuário pode rodar, ao lado do
 * "Adicionar". Sem input e sem confirm roda no clique; as outras abrem o diálogo. Depois, as listas recarregam.
 */
export default function ListActions({ entity }: { entity: string }) {
  const { entities, icons, client } = useEngine();
  const { def, capabilities } = entities[entity];
  const text = useText();
  const { runList, running, error, fieldErrors, reset } = useAction(entity);
  const [open, setOpen] = useState<ActionDef | null>(null);
  const form = useActionInput(open);
  const size = useGridFullScreen(form, open);
  // a tarefa vai do clique até rodar com sucesso; fechar o diálogo antes disso é abandono
  const task = useTaskTelemetry();
  const deliver = useActionReply();
  const steps = useStepsRun(entity);
  const actions = (def.actions ?? []).filter((a) => a.target === 'list' && capabilities.actions?.[a.name]);
  if (actions.length === 0) return null;

  // ação em etapas: o diálogo do input fecha e a barra assume; falha numa etapa fica na barra, não no input
  async function stepped(action: ActionDef, body: Record<string, unknown>) {
    setOpen(null);
    const out = await steps.run(action.name, body);
    if (out.kind === 'stopped') notify(`Parado em ${out.done} de ${out.total}. O que já rodou ficou gravado.`, 'warning');
    if (out.kind !== 'finished') return true;
    notify(out.result.message ?? (action.successMessage ? text(action.successMessage) : 'Feito.'));
    deliver(out.result);
    return true;
  }

  async function execute(action: ActionDef, body: Record<string, unknown>) {
    if (action.steps) return stepped(action, body);
    const result = await runList(action.name, body);
    if (result) {
      notify(result.message ?? (action.successMessage ? text(action.successMessage) : 'Feito.'));
      deliver(result);
    }
    return Boolean(result);
  }

  async function start(action: ActionDef) {
    task.start({ entity, op: 'action', action: action.name });
    if (runsAtOnce(action)) {
      if (await execute(action, {})) task.done();
      else setOpen(action); // mostra o erro no diálogo
      return;
    }
    reset();
    const initial = await loadPrefill(client, entity, action, undefined);
    if (!initial) return task.abandon();
    form.reset(action, initial);
    setOpen(action);
  }

  async function confirm() {
    const body = open && form.body();
    if (open && body && (await execute(open, body))) {
      task.done();
      setOpen(null);
    }
  }

  const errorOf = (name: string) => form.localErrors[name] ?? fieldErrors[name]?.[0]?.message;
  const generalError =
    error && (Object.keys(fieldErrors).length === 0 || Object.keys(fieldErrors).some((k) => !form.knows(k))) ? error : undefined;

  return (
    <>
      {actions.map((a) => {
        const Icon = iconByName(a.icon, icons);
        return (
          <Button
            key={a.name}
            variant="outlined"
            color="secondary"
            startIcon={Icon ? <Icon size={18} /> : undefined}
            onClick={() => start(a)}
            disabled={running || steps.state !== null}
          >
            {text(a.label)}
          </Button>
        );
      })}
      <ActionDialog
        open={open !== null}
        title={open ? text(open.label) : ''}
        description={open?.description ? text(open.description) : undefined}
        confirm={open?.confirm ? text(open.confirm) : undefined}
        confirmLabel={open?.confirmLabel ? text(open.confirmLabel) : undefined}
        tone={open?.tone}
        {...size}
        loading={running}
        error={generalError}
        dirty={form.dirty}
        onClose={() => {
          task.abandon();
          setOpen(null);
        }}
        onConfirm={confirm}
      >
        <ActionBody entity={entity} action={open} form={form} error={errorOf} />
      </ActionDialog>
      <StepsDialog
        title={text(actions.find((a) => a.name === steps.state?.action)?.label ?? '')}
        state={steps.state}
        onStop={steps.requestStop}
        onClose={steps.close}
      />
    </>
  );
}
