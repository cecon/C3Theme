import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useEngine, useText } from '../context';
import { displayValue, findOption } from '../format';
import EntityDialog from '../pages/EntityDialog';
import type { WireRecord } from '../types';
import AgentFields from './AgentFields';
import { stateLabel, type AgentPartProps } from './part';
import { checkRecord, type RecordPayload } from './payload';
import useAgentValues from './useAgentValues';
import { recordTitle } from '../views';
import { STALE_UNDO, UNDO_MS, undoable as entityUndoable } from '../undo';
import useRecordSave, { type Saved } from './useRecordSave';

/**
 * `c3.record`: rascunho de um registro que o assistente montou. O usuário confere (o que ele sugeriu vem marcado; na
 * alteração, com o valor de antes), corrige e grava pelo CRUD da entidade, com a própria permissão. Depois de gravar,
 * "Desfazer" por 30 s, conferido pela versão no servidor (entidade `undoable: false` não tem). O que o card não mostra
 * vai pelo formulário completo.
 */
export default function RecordPart(props: AgentPartProps) {
  const { entities, client } = useEngine();
  const problem = checkRecord(props.part.payload, entities);
  const p = props.part.payload as RecordPayload;
  const { data: current, error } = useSWR(!problem && p.id ? ['c3-record', p.entity, p.id] : null, () => client.get(p.entity, p.id!));
  if (problem) return <Alert severity="warning">O assistente mandou um rascunho inválido ({problem}).</Alert>;
  if (error) return <Alert severity="error">Não deu para abrir o registro ({error instanceof Error ? error.message : 'erro'}).</Alert>;
  if (p.id && !current) return <Skeleton variant="rounded" height={96} />;
  return <RecordBody {...props} payload={p} current={current} />;
}

function RecordBody({ part, open, onAnswer, payload, current }: AgentPartProps & { payload: RecordPayload; current?: WireRecord }) {
  const { entities } = useEngine();
  const text = useText();
  const intl = useIntl();
  const { def, capabilities } = entities[payload.entity];
  const isNew = !payload.id;
  const fields = def.fields.filter((f) => f.name in payload.values);
  const form = useAgentValues(fields, payload.values, payload.suggested);
  const saver = useRecordSave(payload.entity, payload.id, fields, current);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [full, setFull] = useState(false);
  const [undoable, setUndoable] = useState(false);
  const allowed = isNew ? capabilities.create : capabilities.update;
  // 412 no Desfazer: alguém gravou depois; tentar de novo não adianta
  const canUndo =
    saved?.version && entityUndoable(def) && saver.error !== STALE_UNDO && (saved.restore ? capabilities.update : capabilities.delete);
  const singular = text(def.label.singular, def.name);

  useEffect(() => {
    if (!saved) return;
    setUndoable(true);
    const t = window.setTimeout(() => setUndoable(false), UNDO_MS);
    return () => window.clearTimeout(t);
  }, [saved]);

  const show = (name: string, v: unknown) => {
    const f = def.fields.find((x) => x.name === name)!;
    return displayValue(f, v, intl.locale, (x) => text(findOption(f, x)?.label, x));
  };
  const before = current && Object.fromEntries(fields.map((f) => [f.name, show(f.name, current[f.name])]));

  async function done(s: Saved) {
    setSaved(s);
    await onAnswer?.({ action: 'accept', values: { id: s.id, title: s.title } });
  }

  async function save() {
    const body = form.body();
    if (!body || form.toReview.length) return;
    const s = await saver.save(body);
    if (s) await done(s);
  }

  async function undo() {
    if (!saved || !(await saver.undo(saved))) return;
    setSaved(null);
    setUndoable(false);
    await onAnswer?.({ action: 'undo', values: { id: saved.id } });
  }

  const heading =
    payload.title ??
    (isNew ? `Novo ${singular.toLowerCase()}` : `Alterar ${singular.toLowerCase()} ${current ? recordTitle(def, current) : ''}`);
  const result = (part.result ?? {}) as { title?: string };
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" component="p">
        {heading}
      </Typography>
      {saved || !open ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" color={part.state === 'submitted' || saved ? 'success.main' : 'text.secondary'}>
            {saved ? `Gravado: ${saved.title}` : part.state === 'submitted' ? `Gravado: ${result.title ?? ''}` : stateLabel(part)}
          </Typography>
          {canUndo && undoable && (
            <Button size="small" disabled={saver.busy} onClick={() => void undo()}>
              Desfazer
            </Button>
          )}
          {saved && saver.error && (
            <Alert severity="warning" sx={{ width: 1 }}>
              {saver.error}
            </Alert>
          )}
        </Stack>
      ) : (
        <>
          {!allowed && (
            <Alert severity="info">
              Você não tem permissão para {isNew ? 'criar' : 'alterar'} {singular.toLowerCase()}.
            </Alert>
          )}
          <AgentFields
            fields={fields}
            values={form.values}
            change={form.change}
            error={form.error(saver.fieldErrors)}
            required={form.required}
            visible={form.visible}
            suggested={payload.suggested}
            confirmed={form.confirmed}
            onConfirm={form.confirm}
            before={before}
            readOnly={!allowed || saver.busy}
            entity={payload.entity}
          />
          {saver.error && <Alert severity="error">{saver.error}</Alert>}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {onAnswer && (
              <Button color="secondary" disabled={saver.busy} onClick={() => void onAnswer({ action: 'decline' })}>
                Agora não
              </Button>
            )}
            {isNew && allowed && <Button onClick={() => setFull(true)}>Formulário completo</Button>}
            <Button variant="contained" disabled={!allowed || saver.busy || form.toReview.length > 0} onClick={() => void save()}>
              {isNew ? 'Gravar' : 'Gravar alteração'}
            </Button>
          </Stack>
        </>
      )}
      {isNew && (
        <EntityDialog
          open={full ? {} : null}
          entity={payload.entity}
          initial={form.values}
          onClose={(changed, rec) => {
            setFull(false);
            if (changed && rec)
              void done({ id: String(rec.id), title: recordTitle(def, rec) || `#${rec.id}`, restore: null, version: rec._version });
          }}
        />
      )}
    </Stack>
  );
}
