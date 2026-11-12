import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

import { iconByName, useEngine, useText } from '../../context';
import { DashboardDef, EntityWidget, WidgetDef, widgetWidth } from '../../dashboard';
import { applyFilters, readValues, type FilterValues } from '../../dashboardFilters';
import { isSummaryWidget } from '../../summary';
import AlertWidget from './AlertWidget';
import DashboardFilters from './DashboardFilters';
import SummaryPanel from './summary/SummaryPanel';
import WidgetPanel from './WidgetPanel';

/**
 * Painel do app.json (pages[].dashboard): widgets numa grade de 12 colunas, na ordem declarada. Os filtros do painel
 * (`filters`) ficam na URL e entram no recorte de cada widget que os liga (`bind`).
 */
export default function Dashboard({ dashboard }: { dashboard: DashboardDef }) {
  const { entities, icons } = useEngine();
  const text = useText();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => dashboard.filters ?? [], [dashboard.filters]);
  const values = useMemo(() => readValues(params, filters), [params, filters]);
  const change = (name: string, v: FilterValues[string]) => {
    const next = new URLSearchParams(params);
    next.delete(`ft.${name}`);
    if (v === undefined) next.set(`f.${name}`, '');
    else if (typeof v === 'string') next.set(`f.${name}`, v);
    else {
      next.set(`f.${name}`, v.id);
      if (v.title) next.set(`ft.${name}`, v.title);
    }
    setParams(next, { replace: true });
  };
  // widget de entidade que o usuário não lista (ou que o sistema não carregou) não aparece; o do resumo não tem entidade
  const widgets = dashboard.widgets.flatMap((w): WidgetDef[] => {
    if (isSummaryWidget(w)) return [w];
    return entities[w.entity]?.capabilities.list ? [applyFilters(w, filters, values)] : [];
  });
  return (
    <>
      {filters.length > 0 && <DashboardFilters filters={filters} values={values} onChange={change} />}
      <Grid container spacing={3}>
        {dashboard.actions?.length ? (
          <Grid size={12}>
            <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
              {dashboard.actions.map((a) => {
                const Icon = iconByName(a.icon, icons);
                return (
                  <Button
                    key={a.path}
                    component={Link}
                    to={a.path}
                    variant={a.variant ?? 'outlined'}
                    startIcon={Icon ? <Icon size={18} /> : undefined}
                  >
                    {text(a.label)}
                  </Button>
                );
              })}
            </Stack>
          </Grid>
        ) : null}
        {widgets.map((w, i) =>
          w.type === 'alert' ? (
            <AlertWidget key={i} widget={w} />
          ) : isSummaryWidget(w) ? (
            <Grid key={i} size={{ xs: 12, lg: widgetWidth(w) }}>
              <SummaryPanel widget={w} source={dashboard.source} />
            </Grid>
          ) : (
            <Grid key={i} size={size(w)}>
              <WidgetPanel widget={w} />
            </Grid>
          )
        )}
      </Grid>
    </>
  );
}

/** KPI com ícone ocupa a linha no celular e meia no tablet; o simples, meia linha. O resto: a linha toda até o desktop. */
function size(w: Exclude<EntityWidget, { type: 'alert' }>) {
  const lg = widgetWidth(w);
  if (w.type === 'kpi') return w.icon ? { xs: 12, sm: 6, lg } : { xs: 6, lg };
  return { xs: 12, lg };
}
