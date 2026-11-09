import useSWR from 'swr';

// material-ui
import Chip from '@mui/material/Chip';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useEngine, useText } from '../../context';
import type { EntityDef } from '../../types';
import { joinAnd, type ListQuery } from './useListQuery';

/**
 * Presets como abas com contagem (`views.list.presetTabs`). Cada aba conta o preset dela somado à busca e aos
 * filtros da barra, numa chamada de contagem por aba; a primeira é a lista sem preset.
 */
export default function PresetTabs({ entity, def, query }: { entity: string; def: EntityDef; query: ListQuery }) {
  const { client, org } = useEngine();
  const text = useText();
  const list = def.views?.list ?? {};
  const presets = list.presets ?? [];
  const { q, baseParts, presetId, set, branchesParam, shownBranches, sourceParams } = query;
  const tabs = [{ id: '', label: text(list.presetTabs?.all ?? 'Todos'), where: undefined }, ...presets];

  const key = ['c3-list', entity, 'tabs', q, JSON.stringify(baseParts), branchesParam, JSON.stringify(sourceParams), org?.active];
  const { data: counts } = useSWR(
    key,
    () =>
      Promise.all(
        tabs.map((t) =>
          client
            .aggregate(entity, {
              measure: 'count',
              q: q || undefined,
              where: joinAnd([...(t.where ? [t.where] : []), ...baseParts]),
              branches: branchesParam ? shownBranches : undefined,
              params: sourceParams
            })
            .then((r) => Number(r[0]?.value ?? 0))
        )
      ),
    { keepPreviousData: true }
  );
  const current = presetId ?? '';

  return (
    <Tabs
      value={tabs.some((t) => t.id === current) ? current : ''}
      onChange={(_, id: string) => set({ preset: id })}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ px: 1.5, borderBottom: 1, borderColor: 'divider' }}
    >
      {tabs.map((t, i) => (
        <Tab
          key={t.id}
          value={t.id}
          iconPosition="end"
          label={text(t.label)}
          sx={{ minHeight: 52 }}
          icon={
            <Chip
              size="small"
              label={counts?.[i] ?? '–'}
              sx={(theme) => ({
                height: 20,
                ml: 0.5,
                fontSize: theme.typography.caption.fontSize,
                ...(t.id === current ? { bgcolor: 'primary.main', color: 'primary.contrastText' } : {})
              })}
            />
          }
        />
      ))}
    </Tabs>
  );
}
