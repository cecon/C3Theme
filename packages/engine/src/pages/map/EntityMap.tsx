import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Dot, PageLoader, Panel } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import { displayValue, findOption } from '../../format';
import { useLive } from '../../live/useLive';
import { BLOCK_SIZE, blockTone, mapGroups, mapLegend, mapPlaces } from '../../map';
import type { FieldDef, WireRecord } from '../../types';
import { cardFields, defaultSortParam, listUpTo } from '../../views';
import AddButton from '../../widgets/AddButton';
import { PresetChips, ViewSwitcher } from '../views/ViewBar';
import { useViewPreset } from '../views/useViewPreset';
import MapBlock from './MapBlock';
import MapGroups from './MapGroups';
import MapRecordDialog from './MapRecordDialog';

/** Mais que isso numa planta é sinal de que falta um filtro: a tela avisa em vez de pedir tudo. */
const LIMIT = 500;

/**
 * Planta da entidade (`views.map`): blocos coloridos pela situação, por coordenada (mesas do salão) ou dentro de
 * grupos (ilha e bomba da pista, setor do KDS). Clicar abre o registro com as ações. Com `live`, acompanha na hora.
 */
export default function EntityMap({ entity }: { entity: string }) {
  const { client, entities, org } = useEngine();
  const { def } = entities[entity];
  useLive(def);
  const text = useText();
  const { locale } = useIntl();
  const { preset, presetId, setPreset } = useViewPreset(def);
  const [openId, setOpenId] = useState<string | null>(null);
  const view = def.views?.map;
  const where = preset?.where;
  const sort = [...(view?.groupBy ?? []), ...(view?.position ? [view.position.y, view.position.x] : [])].join(',');

  const { data, error, isLoading } = useSWR(
    view ? ['c3-list', entity, 'map', JSON.stringify(where), org?.active] : null,
    () => listUpTo(client, entity, { where, sort: sort || defaultSortParam(def) }, LIMIT),
    { keepPreviousData: true }
  );

  if (!view) return <Alert severity="warning">{`${text(def.label.plural)} não declara views.map.`}</Alert>;

  const rows = data?.rows ?? [];
  // o diálogo mostra a linha da leitura mais recente: com `live`, acompanha o que outra sessão fez; sumiu, fecha
  const open = openId ? (rows.find((r) => r.id === openId) ?? null) : null;
  const fields = cardFields(def, view.fields);
  const colorField = def.fields.find((f) => f.name === view.color && f.denied !== 'hidden');
  const size = BLOCK_SIZE[view.size ?? 'medium'];
  const label = (f: FieldDef, v: unknown) => displayValue(f, v, locale, (x) => text(findOption(f, x)?.label, x));
  // número solto não diz nada na caixa ("4"): leva o nome do campo ("Lugares 4")
  const groupLabel = (f: FieldDef, v: unknown) => (f.type === 'integer' ? `${text(f.label, f.name)} ${label(f, v)}` : label(f, v));
  const block = (row: WireRecord) => (
    <MapBlock
      def={def}
      row={row}
      fields={fields}
      tone={colorField ? blockTone(def, view, row) : 'neutral'}
      status={colorField ? label(colorField, row[colorField.name]) : undefined}
      onOpen={(r) => setOpenId(r.id ?? null)}
    />
  );
  const legend = colorField ? mapLegend(def, view, rows) : [];
  const places = view.position ? mapPlaces(view, rows) : null;
  const flow = (list: WireRecord[]) => (
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))` }}>
      {list.map((r) => (
        <Box key={r.id} sx={{ minHeight: size * 0.75 }}>
          {block(r)}
        </Box>
      ))}
    </Box>
  );

  return (
    <Panel
      title={text(view.title, text(def.label.plural))}
      flush
      action={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ViewSwitcher def={def} current="map" preset={presetId} />
          <AddButton entity={entity} preset={presetId} />
        </Stack>
      }
    >
      <Box sx={{ pt: 2 }}>
        <PresetChips def={def} presetId={presetId} onChange={setPreset} />
      </Box>
      {legend.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ px: 2, pb: 1.5, flexWrap: 'wrap', rowGap: 0.5 }} aria-label="Legenda">
          {legend.map((l) => (
            <Stack key={String(l.value)} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Dot tone={l.color} />
              <Typography variant="body2">{`${text(l.label)} (${l.count})`}</Typography>
            </Stack>
          ))}
        </Stack>
      )}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error.message}
        </Alert>
      )}
      {data && data.total > rows.length && (
        <Alert severity="warning" sx={{ mx: 2, mb: 2 }}>
          {`Mostrando ${rows.length} de ${data.total} registros. Use um filtro para ver todos.`}
        </Alert>
      )}
      {isLoading && !data && <PageLoader />}
      {data && rows.length === 0 && (
        <Typography color="text.secondary" sx={{ px: 2, py: 6, textAlign: 'center' }}>
          Nenhum registro com este filtro.
        </Typography>
      )}
      <Box sx={{ px: 2, pb: 2, overflowX: 'auto' }}>
        {places ? (
          <>
            <Box
              role="group"
              aria-label="Planta"
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: `repeat(${places.columns}, ${size}px)`,
                gridAutoRows: `${Math.round(size * 0.75)}px`
              }}
            >
              {places.placed.map((p) => (
                <Box key={p.row.id} sx={{ gridColumn: `${p.x} / span ${p.w}`, gridRow: `${p.y} / span ${p.h}` }}>
                  {block(p.row)}
                </Box>
              ))}
            </Box>
            {places.clash.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {`${places.clash.length} no mesmo lugar de outro bloco. Corrija a posição no cadastro.`}
                </Alert>
                {flow(places.clash)}
              </Box>
            )}
            {places.loose.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Sem lugar na planta
                </Typography>
                {flow(places.loose)}
              </Box>
            )}
          </>
        ) : (
          <MapGroups groups={mapGroups(def, view, rows, groupLabel)} render={flow} />
        )}
      </Box>
      <MapRecordDialog entity={entity} row={open} fields={colorField ? [colorField, ...fields] : fields} onClose={() => setOpenId(null)} />
    </Panel>
  );
}
