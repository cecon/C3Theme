// Página `apiDocs` do app.json (#33): lê o openapi.json pelo cliente do motor (com o token da sessão) e mostra as
// rotas por tag, com a busca por caminho ou resumo e o "experimentar" em cada rota.
import { useEffect, useMemo, useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { PanelSkeleton } from '@c3theme/ui';
import { useEngine } from '../../context';
import { filterGroups, groupOperations, type ApiGroup } from './openapi';
import Operation from './Operation';

export interface ApiDocsDef {
  /** Caminho do openapi.json, relativo à base da API do motor. */
  spec: string;
}

type State = { groups: ApiGroup[]; title?: string; version?: string } | { error: string };

export default function ApiDocs({ def }: { def: ApiDocsDef }) {
  const { client } = useEngine();
  const [state, setState] = useState<State>();
  const [q, setQ] = useState('');
  useEffect(() => {
    let alive = true;
    if (!client.raw) {
      setState({ error: 'Este cliente do motor não faz pedido livre à API.' });
      return;
    }
    client.raw('GET', def.spec).then(
      (r) => {
        if (!alive) return;
        if (r.status >= 400) return setState({ error: `Não deu para ler ${def.spec} (status ${r.status}).` });
        try {
          const doc = JSON.parse(r.body);
          setState({ groups: groupOperations(doc), title: doc.info?.title, version: doc.info?.version });
        } catch {
          setState({ error: `${def.spec} não é um JSON válido.` });
        }
      },
      (e: Error) => alive && setState({ error: e.message })
    );
    return () => {
      alive = false;
    };
  }, [client, def.spec]);
  const groups = useMemo(() => (state && 'groups' in state ? filterGroups(state.groups, q) : []), [state, q]);

  if (!state) return <PanelSkeleton />;
  if ('error' in state) return <Alert severity="warning">{state.error}</Alert>;
  return (
    <Stack spacing={2}>
      {state.title && (
        <Typography variant="h5" component="h2">
          {state.title}
          {state.version && (
            <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
              {state.version}
            </Typography>
          )}
        </Typography>
      )}
      <TextField size="small" label="Buscar rota" placeholder="Caminho ou resumo" value={q} onChange={(e) => setQ(e.target.value)} />
      {groups.length === 0 && <Typography color="text.secondary">Nenhuma rota com “{q}”.</Typography>}
      {groups.map((g) => (
        <Stack key={g.tag} spacing={1} component="section" aria-label={g.tag}>
          <Typography variant="h6" component="h3">
            {g.tag}
          </Typography>
          {g.description && <Typography color="text.secondary">{g.description}</Typography>}
          {g.operations.map((op) => (
            <Operation key={`${g.tag}-${op.id}`} op={op} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
