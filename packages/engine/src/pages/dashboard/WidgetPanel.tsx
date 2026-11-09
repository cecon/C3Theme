import { useState } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { Chart as ChartIcon, RowVertical } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import { useText } from '../../context';
import { chartKind, type ChartWidget as Chart, type WidgetDef } from '../../dashboard';
import AreaWidget from './AreaWidget';
import ChartWidget from './ChartWidget';
import FeedWidget from './FeedWidget';
import KpiWidget from './KpiWidget';
import ListWidget from './ListWidget';
import RankingWidget from './RankingWidget';

/** Um widget do painel no seu cartão: título, subtítulo e o controle do cabeçalho (períodos ou gráfico/tabela). */
export default function WidgetPanel({ widget }: { widget: Exclude<WidgetDef, { type: 'alert' }> }) {
  const text = useText();
  const title = text(widget.title);
  if (widget.type === 'kpi')
    return (
      <Panel sx={{ height: '100%' }}>
        <KpiWidget widget={widget} />
      </Panel>
    );
  if (widget.type === 'chart') return <ChartPanel widget={widget} />;
  const subtitle = 'subtitle' in widget && widget.subtitle ? text(widget.subtitle) : undefined;
  return (
    <Panel title={title} subtitle={subtitle} flush sx={{ height: '100%' }}>
      {widget.type === 'list' && <ListWidget widget={widget} />}
      {widget.type === 'ranking' && <RankingWidget widget={widget} />}
      {widget.type === 'feed' && <FeedWidget widget={widget} />}
    </Panel>
  );
}

function ChartPanel({ widget }: { widget: Chart }) {
  const text = useText();
  const [table, setTable] = useState(false);
  const ranges = widget.ranges ?? [];
  const [range, setRange] = useState(ranges.length ? Math.max(...ranges) : undefined);
  const area = chartKind(widget) === 'area';
  const label = table ? 'Ver como gráfico' : 'Ver como tabela';
  const action =
    area && ranges.length > 1 ? (
      <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, v: number | null) => v && setRange(v)} aria-label="Período">
        {ranges.map((n) => (
          <ToggleButton key={n} value={n}>
            {n} {widget.interval === 'day' ? 'dias' : widget.interval === 'year' ? 'anos' : 'meses'}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    ) : area ? undefined : (
      <Tooltip title={label}>
        <IconButton size="small" aria-label={label} aria-pressed={table} onClick={() => setTable((t) => !t)}>
          {table ? <ChartIcon size={18} /> : <RowVertical size={18} />}
        </IconButton>
      </Tooltip>
    );
  return (
    <Panel
      title={text(widget.title)}
      subtitle={widget.subtitle ? text(widget.subtitle) : undefined}
      sx={{ height: '100%' }}
      action={chartKind(widget) === 'donut' ? undefined : action}
    >
      {area ? <AreaWidget widget={widget} last={range} /> : <ChartWidget widget={widget} table={table} />}
    </Panel>
  );
}
