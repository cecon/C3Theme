import { useEffect, useState } from 'react';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { evaluate } from '../conditions.mjs';
import { useEngine, useText } from '../context';
import useAction from '../hooks/useAction';
import { saveActionFile } from '../hooks/useActionReply';
import useUndoAction from '../hooks/useUndoAction';
import { fieldTypes } from '../sectionVisibility';
import type { ActionDef, WireRecord } from '../types';
import { paletteOf } from '../tone';
import { plainInputs } from '../actionTypes';
import { UNDO_MS } from '../undo';
import { recordTitle } from '../views';
import AgentFields from './AgentFields';
import { stateLabel, type AgentPartProps } from './part';
import { checkAction, type ActionPayload } from './payload';
import useAgentValues from './useAgentValues';

/** Registro lido → valores da condição: reference vira só o id. */
const plain = (r: WireRecord) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === 'object' && 'id' in v ? (v as { id: string }).id : v]));

/**
 * `c3.action`: o assistente propõe rodar uma ação declarada na entidade sobre um registro. O card diz o quê e em
 * qual registro, com o input já preenchido; roda pelo endpoint da ação, com a permissão do usuário. Ação `danger`
 * pede um passo a mais ("Sim, …") antes de rodar. Ação com `inverse` oferece Desfazer por 30 s, conferido pela versão
 * no servidor.
 */
export default function ActionPart(props: AgentPartProps) {
  const { entities, client } = useEngine();
  const problem = checkAction(props.part.payload, entities);
  const p = props.part.payload as ActionPayload;
  const { data: record, error } = useSWR(problem ? null : ['c3-record', p.entity, p.id], () => client.get(p.entity, p.id));
  if (problem) return <Alert severity="warning">O assistente propôs uma ação inválida ({problem}).</Alert>;
  if (error) return <Alert severity="error">Não deu para abrir o registro ({error instanceof Error ? error.message : 'erro'}).</Alert>;
  if (!record) return <Skeleton variant="rounded" height={72} />;
  const { def } = entities[p.entity];
  return <ActionBody {...props} payload={p} record={record} action={def.actions!.find((a) => a.name === p.action)!} />;
}

function ActionBody(props: AgentPartProps & { payload: ActionPayload; record: WireRecord; action: ActionDef }) {
  const { part, open, onAnswer, payload, record, action } = props;
  const { entities } = useEngine();
  const text = useText();
  const { def, capabilities } = entities[payload.entity];
  const fields = plainInputs(action);
  const form = useAgentValues(fields, payload.input, payload.suggested);
  const runner = useAction(payload.entity);
  const [step, setStep] = useState<'ask' | 'sure'>('ask');
  const [message, setMessage] = useState<string | null>();
  const undoer = useUndoAction(payload.entity);
  // versão de depois da ação: o Desfazer só vale se o registro ainda está nela
  const [after, setAfter] = useState<string>();
  const [undoNote, setUndoNote] = useState<string>();
  const tone = action.tone ?? 'neutral';
  const label = text(action.label, action.name);
  const title = recordTitle(def, record) || `#${record.id}`;
  const allowed = Boolean(capabilities.actions?.[action.name]);
  const applies = !action.visibleWhen || evaluate(action.visibleWhen, plain(record), fieldTypes(def));

  async function run() {
    const body = form.body();
    if (!body || form.toReview.length) return;
    if (tone === 'danger' && step === 'ask') return setStep('sure');
    const result = await runner.run(payload.id, action.name, fields.length ? body : undefined);
    if (!result) return setStep('ask');
    saveActionFile(result);
    const done = result.message ?? (action.successMessage ? text(action.successMessage) : null);
    setMessage(done ?? null);
    if (result.data?._version && undoer.inverse(action)) setAfter(result.data._version);
    await onAnswer?.({ action: 'accept', values: { message: done } });
  }

  useEffect(() => {
    if (!after) return;
    const t = window.setTimeout(() => setAfter(undefined), UNDO_MS);
    return () => window.clearTimeout(t);
  }, [after]);

  async function undo() {
    if (!after) return;
    const outcome = await undoer.undo(payload.id, action, after);
    setAfter(undefined);
    setUndoNote(outcome.message);
    if (outcome.ok) await onAnswer?.({ action: 'undo', values: { id: payload.id } });
  }

  const finished = message !== undefined || !open;
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" component="p">
        {label} · {title}
      </Typography>
      {action.description && (
        <Typography variant="body2" color="text.secondary">
          {text(action.description)}
        </Typography>
      )}
      {finished ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" color={part.state === 'submitted' || message !== undefined ? 'success.main' : 'text.secondary'}>
            {message !== undefined || part.state === 'submitted'
              ? (message ?? (part.result as { message?: string } | undefined)?.message ?? 'Feito.')
              : stateLabel(part)}
          </Typography>
          {after && (
            <Button size="small" onClick={() => void undo()}>
              Desfazer
            </Button>
          )}
          {undoNote && (
            <Typography variant="body2" color="text.secondary" sx={{ width: 1 }}>
              {undoNote}
            </Typography>
          )}
        </Stack>
      ) : (
        <>
          {!allowed && <Alert severity="info">Você não tem permissão para esta ação.</Alert>}
          {allowed && !applies && <Alert severity="info">Esta ação não vale mais para o registro como ele está.</Alert>}
          {fields.length > 0 && (
            <AgentFields
              fields={fields}
              rows={action.input?.rows}
              values={form.values}
              change={form.change}
              error={form.error(runner.fieldErrors)}
              required={form.required}
              visible={form.visible}
              suggested={payload.suggested}
              confirmed={form.confirmed}
              onConfirm={form.confirm}
              readOnly={!allowed || !applies || runner.running}
            />
          )}
          {runner.error && <Alert severity="error">{runner.error}</Alert>}
          {step === 'sure' && (
            <Alert severity="error" variant="outlined">
              {action.confirm ? text(action.confirm) : `Confirmar “${label}” em ${title}?`}
            </Alert>
          )}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            {onAnswer && (
              <Button
                color="secondary"
                disabled={runner.running}
                onClick={() => (step === 'sure' ? setStep('ask') : void onAnswer({ action: 'decline' }))}
              >
                {step === 'sure' ? 'Voltar' : 'Agora não'}
              </Button>
            )}
            <Button
              variant="contained"
              color={paletteOf(tone, 'primary')}
              disabled={!allowed || !applies || runner.running || form.toReview.length > 0}
              onClick={() => void run()}
            >
              {step === 'sure' ? `Sim, ${label.toLowerCase()}` : action.confirmLabel ? text(action.confirmLabel) : label}
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
