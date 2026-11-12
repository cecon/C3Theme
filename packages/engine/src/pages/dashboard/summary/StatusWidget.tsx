import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useSWRConfig } from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { notify, StatusChip } from '@c3theme/ui';
import { errorMessage } from '../../../auth/pages/shared';
import { useEngine, useText } from '../../../context';
import {
  formatSummary,
  itemsAt,
  numberAt,
  pick,
  statusActions,
  statusNotices,
  type StatusWidget as Status,
  type SummarySource
} from '../../../summary';
import SummaryDetails from './SummaryDetails';
import SummaryEmpty from './SummaryEmpty';

/**
 * Objeto único com estado (o card de atualização): chip do estado, campos, avisos (canal beta), barra de progresso,
 * a mensagem de erro do sistema e as ações que o sistema libera agora. Ação desabilitada mostra a instrução embaixo.
 */
export default function StatusWidget({ widget, summary, source }: { widget: Status; summary: unknown; source: SummarySource }) {
  const text = useText();
  const { locale } = useIntl();
  const { client, org } = useEngine();
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState<string>();
  const item = itemsAt(summary, widget.from)[0];
  if (!item) return <SummaryEmpty text={widget.empty} />;

  const value = String(pick(item, widget.state) ?? '');
  const state = widget.states[value];
  const progress = numberAt(item, widget.progress);
  const message = widget.message ? pick(item, widget.message) : undefined;
  const actions = statusActions(widget, item);
  const run = async (id: string, path: string) => {
    setBusy(id);
    try {
      const next = await client.summaryAction!(path);
      const key = ['c3-summary', source.path, org?.active];
      await (next === undefined ? mutate(key) : mutate(key, next, { revalidate: false }));
    } catch (e) {
      notify(errorMessage(e), 'error');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <Stack spacing={1.5}>
      <div>
        <StatusChip label={state ? text(state.label) : value} tone={state?.tone ?? 'neutral'} />
      </div>
      <SummaryDetails details={widget.fields} item={item} />
      {statusNotices(widget, item).map((n, i) => (
        <Alert key={i} severity={n.tone ?? 'info'} variant="outlined">
          {text(n.text)}
        </Alert>
      ))}
      {progress !== undefined && (
        <Stack spacing={0.5}>
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, progress))}
            aria-label={`${text(widget.title)}: ${Math.round(progress)}%`}
          />
          <Typography variant="caption" color="text.secondary">
            {formatSummary(progress, 'percent', locale)}
          </Typography>
        </Stack>
      )}
      {typeof message === 'string' && message !== '' && (
        <Alert severity="error" variant="outlined">
          {message}
        </Alert>
      )}
      {actions.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
          {actions.map(({ action, disabled, instruction }) => (
            <Stack key={action.id} spacing={0.5} sx={{ maxWidth: 280 }}>
              <Button
                variant={action.variant ?? 'outlined'}
                disabled={disabled || busy !== undefined || !client.summaryAction}
                onClick={() => run(action.id, action.path)}
                aria-describedby={disabled && instruction ? `${action.id}-instrucao` : undefined}
              >
                {text(action.label)}
              </Button>
              {disabled && instruction && (
                <Typography id={`${action.id}-instrucao`} variant="caption" color="text.secondary">
                  {instruction}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
