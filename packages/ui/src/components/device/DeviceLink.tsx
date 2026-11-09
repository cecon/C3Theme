import { ReactNode, useEffect, useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Danger, Mobile, TickCircle } from 'iconsax-reactjs';

import SoftAvatar from '../SoftAvatar';
import PairingCode from './PairingCode';
import PhoneForm from './PhoneForm';
import QrCode from './QrCode';
import Steps from './Steps';
import { useDeviceText } from './text';

export type DeviceLinkStatus = 'connecting' | 'qr' | 'pairing-code' | 'connected' | 'logged-out' | 'error';

export interface DeviceLinkProps {
  status: DeviceLinkStatus;
  /** Texto do QR (o app recebe do serviço e repassa; o QR é desenhado aqui, sem rede). */
  qr?: string;
  /** Código de pareamento de 8 caracteres, no estado `pairing-code`. */
  pairingCode?: string;
  /** Número já conhecido: "Usar código" chama `onUsePairingCode` direto, sem pedir o número. */
  phone?: string;
  /** Conta ligada, mostrada em `connected` (ex.: "+55 11 98765-4321"). */
  account?: string;
  /** Passos do QR; o padrão é genérico (o app troca para citar o aplicativo dele). */
  steps?: ReactNode[];
  /** Passos do código de pareamento. */
  codeSteps?: ReactNode[];
  /** Detalhe do erro no estado `error`. */
  error?: ReactNode;
  /** Pede o código de pareamento para o número (só dígitos, com DDI). Sem ele o botão não aparece. */
  onUsePairingCode?: (phone: string) => void;
  onUseQr?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

const QR_SIZE = 232;

/** Ligar um aparelho (ex.: número de WhatsApp) por QR Code ou código de pareamento, com cada estado da conexão. */
export default function DeviceLink(props: DeviceLinkProps) {
  const { status, qr = '', pairingCode, phone, account, error, onUsePairingCode, onUseQr, onCancel, onRetry } = props;
  const t = useDeviceText();
  const [askPhone, setAskPhone] = useState(false);
  useEffect(() => setAskPhone(false), [status]);

  const steps = props.steps ?? [t('c3.device.qr.step1'), t('c3.device.qr.step2'), t('c3.device.qr.step3')];
  const codeSteps = props.codeSteps ?? [t('c3.device.code.step1'), t('c3.device.code.step2'), t('c3.device.code.step3')];
  const cancel = onCancel && (
    <Button color="secondary" onClick={onCancel}>
      {t('c3.device.cancel')}
    </Button>
  );
  const retry = onRetry && (
    <Button variant="contained" onClick={onRetry}>
      {t('c3.device.retry')}
    </Button>
  );

  function useCode() {
    if (!onUsePairingCode) return;
    const digits = phone?.replace(/\D/g, '');
    if (digits) onUsePairingCode(digits);
    else setAskPhone(true);
  }

  if (status === 'connecting')
    return (
      <Frame visual={<CircularProgress aria-hidden />} title={t('c3.device.connecting')} tall busy>
        <Actions>{cancel}</Actions>
      </Frame>
    );

  if (status === 'qr' && askPhone && onUsePairingCode)
    return (
      <Frame
        visual={
          <SoftAvatar size="xl" tone="primary">
            <Mobile size={32} />
          </SoftAvatar>
        }
        title={t('c3.device.phone.title')}
      >
        <PhoneForm defaultPhone={phone} onSubmit={onUsePairingCode} onBack={() => setAskPhone(false)} />
      </Frame>
    );

  if (status === 'qr')
    return (
      <Frame visual={<QrCode value={qr} size={QR_SIZE} label={t('c3.device.qr.label')} />} tall title={t('c3.device.qr.title')}>
        <Steps steps={steps} />
        <Typography variant="caption" color="text.secondary">
          {t('c3.device.qr.renew')}
        </Typography>
        <Actions>
          {onUsePairingCode && (
            <Button variant="outlined" onClick={useCode}>
              {t('c3.device.useCode')}
            </Button>
          )}
          {cancel}
        </Actions>
      </Frame>
    );

  if (status === 'pairing-code')
    return (
      <Frame
        visual={
          <SoftAvatar size="xl" tone="primary">
            <Mobile size={32} />
          </SoftAvatar>
        }
        title={t('c3.device.code.title')}
      >
        <Steps steps={codeSteps} />
        {pairingCode ? <PairingCode code={pairingCode} /> : <CircularProgress size={24} aria-label={t('c3.device.connecting')} />}
        <Actions>
          {onUseQr && (
            <Button variant="outlined" onClick={onUseQr}>
              {t('c3.device.useQr')}
            </Button>
          )}
          {cancel}
        </Actions>
      </Frame>
    );

  if (status === 'connected')
    return (
      <Frame
        visual={
          <SoftAvatar size="xl" tone="success">
            <TickCircle size={32} />
          </SoftAvatar>
        }
        title={t('c3.device.connected')}
      >
        {account && <Typography color="text.secondary">{t('c3.device.connectedAs', { account })}</Typography>}
      </Frame>
    );

  if (status === 'logged-out')
    return (
      <Frame
        visual={
          <SoftAvatar size="xl" tone="warning">
            <Mobile size={32} />
          </SoftAvatar>
        }
        title={t('c3.device.loggedOut')}
      >
        <Typography color="text.secondary">{t('c3.device.loggedOut.hint')}</Typography>
        <Actions>{retry}</Actions>
      </Frame>
    );

  return (
    <Frame
      visual={
        <SoftAvatar size="xl" tone="danger">
          <Danger size={32} />
        </SoftAvatar>
      }
      title={t('c3.device.error')}
    >
      <Alert severity="error" variant="outlined">
        {error ?? t('c3.device.error.hint')}
      </Alert>
      <Actions>
        {retry}
        {cancel}
      </Actions>
    </Frame>
  );
}

/**
 * Visual à esquerda (QR, ícone) e texto à direita; no celular, um embaixo do outro. O título avisa a troca de estado.
 * `tall` guarda a altura do QR (conectando → QR não pula).
 */
function Frame(props: { visual: ReactNode; title: string; tall?: boolean; busy?: boolean; children?: ReactNode }) {
  const { visual, title, tall, busy, children } = props;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { xs: 'center', sm: 'flex-start' } }} aria-busy={busy}>
      <Box
        sx={{
          flex: 'none',
          width: QR_SIZE,
          maxWidth: '100%',
          minHeight: { sm: tall ? QR_SIZE : 0 },
          display: 'grid',
          placeItems: 'center'
        }}
      >
        {visual}
      </Box>
      <Stack spacing={2} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        <Typography variant="h5" component="h2" aria-live="polite">
          {title}
        </Typography>
        {children}
      </Stack>
    </Stack>
  );
}

function Actions({ children }: { children?: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {children}
    </Stack>
  );
}
