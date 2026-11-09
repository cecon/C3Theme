// material-ui
import Box from '@mui/material/Box';

import EmptyState from '../EmptyState';
import AccessRequestItem, { AccessRequest } from './AccessRequestItem';
import { useDeviceText } from './text';
import { useNow } from './useNow';

export interface AccessRequestsProps {
  requests: AccessRequest[];
  onApprove: (request: AccessRequest) => void;
  onReject: (request: AccessRequest) => void;
  /** Pedidos sendo aprovados ou recusados agora: os botões ficam desligados até o app tirar o id daqui. */
  busyIds?: string[];
  /** De quanto em quanto tempo o "há 5 minutos" se atualiza. */
  refreshMs?: number;
}

/** Pedidos de acesso pendentes: só callbacks, sem rede. O tempo decorrido usa um relógio só para a lista toda. */
export default function AccessRequests({ requests, onApprove, onReject, busyIds = [], refreshMs = 30_000 }: AccessRequestsProps) {
  const t = useDeviceText();
  const now = useNow(refreshMs, requests.length > 0);
  if (!requests.length) return <EmptyState dense title={t('c3.access.empty')} />;
  return (
    <Box component="ul" aria-label={t('c3.access.title')} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {requests.map((request) => (
        <AccessRequestItem
          key={request.id}
          request={request}
          now={now}
          busy={busyIds.includes(request.id)}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </Box>
  );
}
