import { useId, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

import SoftAvatar from '../SoftAvatar';
import { formatPhone } from './allowRules';
import { elapsed, formatPairingCode, spellPairingCode, toMillis } from './format';
import { useDeviceText } from './text';

export interface AccessRequest {
  id: string;
  /** Nome que a pessoa usa no aplicativo; sem ele aparece o telefone. */
  name?: string;
  /** Telefone com DDI, só dígitos ou já formatado. */
  phone: string;
  /** Código que a pessoa recebeu e vai confirmar. */
  code: string;
  /** Primeira mensagem, como texto puro (HTML aparece como texto, não é interpretado). */
  message?: string;
  receivedAt: string | number | Date;
}

export interface AccessRequestItemProps {
  request: AccessRequest;
  now: number;
  busy?: boolean;
  onApprove: (request: AccessRequest) => void;
  onReject: (request: AccessRequest) => void;
}

/** Só para o leitor de tela. */
const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' } as const;

const initials = (text: string) =>
  text
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w.match(/\p{L}/u)?.[0]?.toUpperCase())
    .join('');

/** Um pedido: quem, telefone, código, há quanto tempo, a primeira mensagem recolhida e as ações. */
export default function AccessRequestItem({ request, now, busy, onApprove, onReject }: AccessRequestItemProps) {
  const t = useDeviceText();
  const intl = useIntl();
  const messageId = useId();
  const [open, setOpen] = useState(false);
  const phone = /^\d+$/.test(request.phone) ? formatPhone(request.phone) : request.phone;
  const who = request.name || phone;
  const at = toMillis(request.receivedAt);
  const ago = elapsed(at, now);

  return (
    <Box component="li" sx={{ py: 2, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-start' } }}>
        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <SoftAvatar size="md" tone="neutral" aria-hidden>
            {initials(request.name ?? '') || '#'}
          </SoftAvatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" component="h3" noWrap>
              {who}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1 }}>
              {request.name && <span>{phone}</span>}
              <span>
                <span aria-hidden>{t('c3.access.code', { code: formatPairingCode(request.code) })}</span>
                <Box component="span" sx={SR_ONLY}>
                  {t('c3.access.code', { code: spellPairingCode(request.code) })}
                </Box>
              </span>
              <time dateTime={new Date(at).toISOString()} title={intl.formatDate(at, { dateStyle: 'short', timeStyle: 'short' })}>
                {intl.formatRelativeTime(ago.value, ago.unit, { numeric: 'auto' })}
              </time>
            </Typography>
            {request.message ? (
              <Box sx={{ mt: 1 }}>
                <Collapse in={open} collapsedSize={0}>
                  <Typography id={messageId} variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', pb: 0.5 }}>
                    {request.message}
                  </Typography>
                </Collapse>
                {!open && (
                  <Typography variant="body2" color="text.secondary" noWrap aria-hidden>
                    {request.message}
                  </Typography>
                )}
                <Button
                  size="small"
                  color="secondary"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls={messageId}
                  endIcon={<ArrowDown2 size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} />}
                  sx={{ ml: -1 }}
                >
                  {open ? t('c3.access.hideMessage') : t('c3.access.showMessage')}
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                {t('c3.access.noMessage')}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flex: 'none', pl: { xs: 6.5, sm: 0 } }}>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => onApprove(request)}
            aria-label={t('c3.access.approveWho', { name: who })}
          >
            {t('c3.access.approve')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={busy}
            onClick={() => onReject(request)}
            aria-label={t('c3.access.rejectWho', { name: who })}
          >
            {t('c3.access.reject')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
