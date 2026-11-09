import type { ElementType } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Call, CloseCircle, DocumentText, Location, Sms, Video } from 'iconsax-reactjs';

import { notify, SoftIconButton, StatusChip, type StatusTone } from '@c3theme/ui';
import { Contact, formatBytes, Message, PRESENCE } from './data';
import StatusAvatar from './StatusAvatar';

function InfoRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>
        <Icon size={18} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

interface ContactDetailsProps {
  contact: Contact;
  messages: Message[];
  onClose: () => void;
}

/** Painel lateral com os dados do contato e os arquivos trocados na conversa. */
export default function ContactDetails({ contact, messages, onClose }: ContactDetailsProps) {
  const files = messages.flatMap((m) => m.attachments ?? []);
  const presence = PRESENCE[contact.presence];

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, minHeight: 72 }}>
        <Typography variant="h5" component="h2">
          Detalhes
        </Typography>
        <IconButton aria-label="Fechar detalhes" onClick={onClose}>
          <CloseCircle size={20} />
        </IconButton>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <StatusAvatar name={contact.name} tone={contact.tone} presence={contact.presence} size="xl" />
          <Typography variant="h5" sx={{ pt: 1 }}>
            {contact.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contact.role}
          </Typography>
          <StatusChip label={presence.label} tone={presence.tone as StatusTone} />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Tooltip title="Ligar">
              <SoftIconButton
                tone="success"
                aria-label="Ligar"
                onClick={() => notify(`Ligando para ${contact.name}… (demonstração)`, 'info')}
              >
                <Call size={18} />
              </SoftIconButton>
            </Tooltip>
            <Tooltip title="Videochamada">
              <SoftIconButton
                tone="info"
                aria-label="Videochamada"
                onClick={() => notify(`Videochamada com ${contact.name}… (demonstração)`, 'info')}
              >
                <Video size={18} />
              </SoftIconButton>
            </Tooltip>
            <Tooltip title="Enviar e-mail">
              <SoftIconButton tone="primary" aria-label="Enviar e-mail" onClick={() => (window.location.href = `mailto:${contact.email}`)}>
                <Sms size={18} />
              </SoftIconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Informações
        </Typography>
        <Stack spacing={1.75}>
          <InfoRow icon={Sms} label="E-mail" value={contact.email} />
          <InfoRow icon={Call} label="Telefone" value={contact.phone} />
          <InfoRow icon={Location} label="Cidade" value={contact.city} />
        </Stack>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Arquivos compartilhados ({files.length})
        </Typography>
        {files.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum arquivo nesta conversa.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {files.map((f, i) => (
              <Stack
                key={`${f.name}-${i}`}
                direction="row"
                spacing={1.25}
                sx={{ alignItems: 'center', p: 1, borderRadius: 2, border: 1, borderColor: 'divider' }}
              >
                <Box sx={{ color: 'primary.main', display: 'flex' }}>
                  <DocumentText size={22} variant="Bulk" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {f.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(f.size)}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
