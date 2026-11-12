import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router';
import useSWR from 'swr';
import { useEngine, useText } from '../context';
import { PageStateContext } from './context';
import RecordActions from '../widgets/RecordActions';
import WidgetError from '../pages/dashboard/WidgetError';
import { useIntl } from 'react-intl';
import type { PageStateAction, PageStateDef, PageStates } from './types';

export function PageStateView({ state, kind, retry }: { state: PageStateDef; kind: keyof PageStates; retry: () => void }) {
  const text = useText();

  const extra = state as PageStates['forbidden'] & PageStates['offline'];
  return (
    <Alert severity={kind === 'error' ? 'error' : 'info'} role={kind === 'error' ? 'alert' : 'status'}>
      <Stack spacing={1}>
        <Typography>{text(state.message)}</Typography>
        {extra?.instruction && <Typography>{text(extra.instruction)}</Typography>}
        {extra?.works?.length ? (
          <ul>
            {extra.works.map((item, i) => (
              <li key={i}>{text(item)}</li>
            ))}
          </ul>
        ) : null}
        {state.action && (
          <PageStateContext.Provider value={undefined}>
            <PageAction action={state.action} retry={retry} />
          </PageStateContext.Provider>
        )}
      </Stack>
    </Alert>
  );
}

function PageAction({ action, retry }: { action: PageStateAction; retry: () => void }) {
  const text = useText();
  if (action.path)
    return (
      <Button component={Link} to={action.path}>
        {text(action.label)}
      </Button>
    );
  if (action.record) return <RecordStateAction action={action} />;
  return <Button onClick={retry}>{text(action.label)}</Button>;
}

function RecordStateAction({ action }: { action: PageStateAction }) {
  const { client, entities } = useEngine();
  const text = useText();
  const target = action.record!;
  const intl = useIntl();
  const entry = entities[target.entity];
  const allowed = !!entry?.capabilities.read && !!entry.capabilities.actions?.[target.action];
  const { data, error, mutate } = useSWR(allowed ? ['c3-record', target.entity, target.id] : null, () =>
    client.get(target.entity, target.id)
  );
  if (error)
    return (
      <Stack spacing={1}>
        <WidgetError error={error} />
        <Button onClick={() => void mutate().catch(() => {})}>
          {intl.formatMessage({ id: 'c3.page.retryTarget', defaultMessage: 'Tentar de novo' })}
        </Button>
      </Stack>
    );
  if (!data) return <Button disabled>{text(action.label)}</Button>;
  return (
    <RecordActions
      entity={target.entity}
      id={target.id}
      record={data}
      ifMatch={typeof data._version === 'string' ? data._version : undefined}
      only={[target.action]}
      labels={{ [target.action]: action.label }}
    />
  );
}
