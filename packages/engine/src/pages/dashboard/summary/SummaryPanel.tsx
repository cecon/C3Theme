// material-ui
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { Panel } from '@c3theme/ui';
import { useText } from '../../../context';
import type { SummarySource, SummaryWidget } from '../../../summary';
import WidgetError from '../WidgetError';
import MeterWidget from './MeterWidget';
import ShareWidget from './ShareWidget';
import StatusWidget from './StatusWidget';
import { useSummary } from './useSummary';

/** Widget do painel por resumo no seu cartão: lê o `source` (o do widget ou o do painel) e desenha pelo tipo. */
export default function SummaryPanel({ widget, source: fallback }: { widget: SummaryWidget; source?: SummarySource }) {
  const text = useText();
  const source = widget.source ?? fallback;
  const { data, error } = useSummary(source);
  return (
    <Panel title={text(widget.title)} subtitle={widget.subtitle ? text(widget.subtitle) : undefined} sx={{ height: '100%' }}>
      {!source ? (
        <WidgetError error={new Error('Widget sem source: declare dashboard.source ou o source do widget.')} />
      ) : error ? (
        <WidgetError error={error} />
      ) : data === undefined ? (
        <Stack spacing={1}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={32} />
          ))}
        </Stack>
      ) : widget.type === 'meter' ? (
        <MeterWidget widget={widget} summary={data} />
      ) : widget.type === 'share' ? (
        <ShareWidget widget={widget} summary={data} />
      ) : (
        <StatusWidget widget={widget} summary={data} source={source} />
      )}
    </Panel>
  );
}
