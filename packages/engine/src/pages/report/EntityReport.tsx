import { useIntl } from 'react-intl';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Printer } from 'iconsax-reactjs';

import { Panel, printHidden, printOnly } from '@c3theme/ui';
import { branchLabel, useEngine, useText } from '../../context';
import { EXPORT_LIMIT, fetchAll } from '../../export';
import { displayValue, findOption } from '../../format';
import { buildReport } from '../../report';
import { rowStyler } from '../../rowStyle';
import type { FieldDef } from '../../types';
import ListToolbar from '../list/ListToolbar';
import ParamsBar from '../list/ParamsBar';
import { useListQuery } from '../list/useListQuery';
import { ViewSwitcher } from '../views/ViewBar';
import ReportTable from './ReportTable';
import { reportFilters } from './reportFilters';
import { useLive } from '../../live/useLive';

/**
 * Relatório da entidade (`views.report`): todas as linhas do filtro (até o limite da exportação), agrupadas com
 * subtotal e total geral, ou em árvore. Os filtros são os da lista, na URL. Imprimir sai só com o relatório e um
 * cabeçalho que diz de onde vieram os números. Acima do limite não mostra nada: total pela metade engana.
 */
export default function EntityReport({ entity }: { entity: string }) {
  const { client, entities, org, app } = useEngine();
  const { def } = entities[entity];
  useLive(def);
  const text = useText();
  const { locale } = useIntl();
  const view = def.views?.report;
  const scoped = org && def.scope && def.scope !== 'group' ? org : undefined;
  const query = useListQuery(def, scoped);
  const { params, presetId, q, where, branchesParam, shownBranches, sourceParams } = query;
  const sort = params.get('sort') ?? view?.sort ?? query.sort;

  const key = view
    ? ['c3-list', entity, 'report', sort, q, JSON.stringify(where), branchesParam, JSON.stringify(sourceParams), org?.active]
    : null;
  const { data, error, isLoading } = useSWR(
    key,
    () =>
      fetchAll(client, entity, {
        sort: sort || undefined,
        q: q || undefined,
        where,
        branches: branchesParam ? shownBranches : undefined,
        params: sourceParams
      }),
    { keepPreviousData: true }
  );

  if (!view) return <Alert severity="warning">{`${text(def.label.plural)} não declara views.report.`}</Alert>;

  const title = text(view.title, text(def.label.plural));
  const columns = view.columns.map((n) => def.fields.find((f) => f.name === n)).filter((f): f is FieldDef => f !== undefined);
  const label = (f: FieldDef, v: unknown) => displayValue(f, v, locale, (x) => text(findOption(f, x)?.label, x));
  const { tooMany, lines } = data ? buildReport(def, view, data, EXPORT_LIMIT, label) : { tooMany: false, lines: [] };
  const branches = scoped ? shownBranches.map((b) => branchLabel(scoped, b).branch) : [];
  const filters = reportFilters(def, params, presetId, sourceParams, branches, locale, text);

  return (
    <Panel
      title={title}
      flush
      action={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ...printHidden }}>
          <Button startIcon={<Printer />} onClick={() => window.print()} disabled={!lines.length}>
            Imprimir
          </Button>
          <ViewSwitcher def={def} current="report" preset={presetId} />
        </Stack>
      }
      sx={{ '@media print': { border: 0, borderRadius: 0, '& > .MuiDivider-root, & > :first-child': { display: 'none' } } }}
    >
      <Box sx={printHidden}>
        {def.source && <ParamsBar def={def} query={query} error={error} />}
        <ListToolbar def={def} query={query} scoped={scoped} />
      </Box>
      <Box sx={{ ...printOnly, mb: 1.5, px: 2 }}>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2">
          {app.name} · emitido em {new Date().toLocaleString(locale)}
        </Typography>
        {filters.length > 0 && <Typography variant="body2">Filtros: {filters.join(' · ')}</Typography>}
      </Box>

      {isLoading && <LinearProgress sx={printHidden} />}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error.message}
        </Alert>
      )}
      {tooMany && (
        <Alert severity="warning" sx={{ m: 2 }}>
          {`O filtro alcança ${(data?.total ?? 0).toLocaleString(locale)} linhas, e o relatório monta até ${EXPORT_LIMIT.toLocaleString(locale)}. Filtre mais para ver os totais certos.`}
        </Alert>
      )}
      {data && !tooMany && data.total === 0 && (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Nenhuma linha com estes filtros.</Typography>
        </Box>
      )}
      {lines.length > 0 && (
        <ReportTable columns={columns} lines={lines} rowSx={rowStyler(view.rowStyles ?? def.views?.list?.rowStyles, def.fields)} />
      )}
    </Panel>
  );
}
