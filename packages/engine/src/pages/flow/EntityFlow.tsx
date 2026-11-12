// Editor de fluxo do registro (`views.flow`, #72): rota /{entity}/:id/flow. Lê o registro pelo GET de sempre, monta
// os tipos de passo da spec e grava o grafo no campo text pelo PATCH. Quem roda o fluxo é o sistema.
import { createElement, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { FlowEditor } from '@c3theme/flow';
import { PanelSkeleton } from '@c3theme/ui';

import { iconByName, useEngine, useText } from '../../context';
import { flowKinds, parseFlow } from '../../flow';
import useLeaveGuard from '../../hooks/useLeaveGuard';
import type { EntityDef, WireRecord } from '../../types';
import type { FlowView } from '../../viewTypes';
import { recordTitle } from '../../views';
import { useFlowDraft } from './useFlowDraft';

export default function EntityFlow({ entity, id }: { entity: string; id: string }) {
  const { client, entities } = useEngine();
  const entry = entities[entity];
  const view = entry?.def.views?.flow;
  const [round, setRound] = useState(0);
  const { data, error, mutate } = useSWR(view ? ['c3-record', entity, id] : null, () => client.get(entity, id));

  if (!view) return <Alert severity="warning">{`A entidade '${entity}' não declara views.flow.`}</Alert>;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!data) return <PanelSkeleton />;
  if (!parseFlow(data[view.field]))
    return <Alert severity="error">{`O campo '${view.field}' não tem um fluxo válido (JSON com nodes e edges).`}</Alert>;
  const reload = async () => {
    await mutate();
    setRound((r) => r + 1);
  };
  return <FlowScreen key={round} def={entry.def} view={view} id={id} record={data} canUpdate={entry.capabilities.update} reload={reload} />;
}

interface FlowScreenProps {
  def: EntityDef;
  view: FlowView;
  id: string;
  record: WireRecord;
  canUpdate: boolean;
  reload: () => Promise<void>;
}

function FlowScreen({ def, view, id, record, canUpdate, reload }: FlowScreenProps) {
  const { icons } = useEngine();
  const text = useText();
  const kinds = useMemo(
    () =>
      flowKinds(view, text, (name) => {
        const Icon = iconByName(name, icons);
        return Icon ? createElement(Icon, { variant: 'Bold' }) : undefined;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `text` muda a cada render; o idioma não muda aqui
    [view, icons]
  );
  const field = def.fields.find((f) => f.name === view.field);
  const readOnly = !canUpdate || Boolean(field?.denied) || Boolean(field?.readOnly);
  const flow = useFlowDraft(def.name, id, view.field, record, kinds);
  useLeaveGuard(flow.dirty);
  const title = recordTitle(def, record) || text(def.label.singular);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <div>
          <Link component={RouterLink} to={`/${def.name}/${encodeURIComponent(id)}`} variant="body2" underline="hover">
            {title}
          </Link>
          <Typography variant="h5" component="h1">
            {text(view.title, 'Fluxo')}
          </Typography>
        </div>
        {!readOnly && (
          <Stack direction="row" spacing={1}>
            <Button onClick={flow.discard} disabled={!flow.dirty || flow.busy}>
              Descartar
            </Button>
            <Button variant="contained" onClick={() => void flow.save()} disabled={!flow.dirty || flow.busy}>
              Salvar
            </Button>
          </Stack>
        )}
      </Stack>
      {readOnly && <Alert severity="info">Você pode ver o fluxo, mas não tem permissão para alterar.</Alert>}
      {flow.error && (
        <Alert
          severity={flow.error.stale ? 'warning' : 'error'}
          action={
            flow.error.stale ? (
              <Button color="inherit" size="small" onClick={() => void reload()}>
                Recarregar
              </Button>
            ) : undefined
          }
        >
          {flow.error.message}
        </Alert>
      )}
      <FlowEditor
        value={flow.draft}
        onChange={readOnly ? undefined : flow.change}
        kinds={kinds}
        minimap={view.minimap ?? true}
        height="max(480px, calc(100dvh - 260px))"
      />
    </Stack>
  );
}
