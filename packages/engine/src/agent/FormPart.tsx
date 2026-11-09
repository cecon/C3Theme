import { useState, type KeyboardEvent } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useEngine } from '../context';
import type { WireRecord } from '../types';
import AgentFields from './AgentFields';
import AgentSummary from './AgentSummary';
import { stateLabel, type AgentPartProps } from './part';
import { checkForm, type FormPayload } from './payload';
import useAgentValues from './useAgentValues';

/**
 * `c3.form`: campos avulsos que o assistente pede (motivo, período, quantidade), com os inputs do motor. Enviar
 * devolve os valores ao assistente; nada é gravado aqui. Ctrl+Enter envia; "Agora não" recusa.
 */
export default function FormPart(props: AgentPartProps) {
  const { entities } = useEngine();
  const problem = checkForm(props.part.payload, entities);
  if (problem) return <Alert severity="warning">O assistente mandou um formulário inválido ({problem}).</Alert>;
  return <FormBody {...props} payload={props.part.payload as FormPayload} />;
}

function FormBody({ part, open, onAnswer, payload }: AgentPartProps & { payload: FormPayload }) {
  const form = useAgentValues(payload.fields, payload.values, payload.suggested);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const canAnswer = open && !!onAnswer && !sending;

  async function answer(action: 'accept' | 'decline', values?: WireRecord) {
    setSending(true);
    setFailed(false);
    const ok = await onAnswer!({ action, values });
    setSending(false);
    if (!ok) setFailed(true);
  }

  function submit() {
    if (!canAnswer || form.toReview.length) return;
    const body = form.body();
    if (body) void answer('accept', body);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <Stack spacing={1.5} onKeyDown={onKeyDown}>
      {payload.title && (
        <Typography variant="subtitle2" component="p">
          {payload.title}
        </Typography>
      )}
      {payload.description && (
        <Typography variant="body2" color="text.secondary">
          {payload.description}
        </Typography>
      )}
      {open ? (
        <AgentFields
          fields={payload.fields}
          rows={payload.rows}
          values={form.values}
          change={form.change}
          error={form.error({})}
          required={form.required}
          visible={form.visible}
          suggested={payload.suggested}
          confirmed={form.confirmed}
          onConfirm={form.confirm}
          readOnly={!canAnswer}
        />
      ) : (
        <Stack spacing={0.75}>
          <Typography variant="caption" color={part.state === 'submitted' ? 'success.main' : 'text.secondary'}>
            {stateLabel(part)}
          </Typography>
          {part.state === 'submitted' && <AgentSummary fields={payload.fields} values={(part.result ?? {}) as WireRecord} />}
        </Stack>
      )}
      {failed && <Alert severity="error">Não deu para enviar ao assistente. Tente de novo.</Alert>}
      {open && onAnswer && (
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button color="secondary" disabled={sending} onClick={() => void answer('decline')}>
            Agora não
          </Button>
          <Button variant="contained" disabled={!canAnswer || form.toReview.length > 0} onClick={submit}>
            {payload.submitLabel ?? 'Enviar'}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
