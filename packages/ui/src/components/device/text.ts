import { useCallback } from 'react';
import { useIntl } from 'react-intl';

// Textos de DeviceLink, AccessRequests e AllowList. Português é o padrão; inglês vem embutido. O app sobrescreve
// qualquer chave nas mensagens do react-intl (C3ThemeProvider loadMessages), por exemplo para citar o WhatsApp.
const PT = {
  'c3.device.connecting': 'Preparando a conexão…',
  'c3.device.qr.title': 'Ligue o aparelho pelo QR Code',
  'c3.device.qr.label': 'QR Code para ligar o aparelho',
  'c3.device.qr.renew': 'O código se renova sozinho enquanto esta tela estiver aberta.',
  'c3.device.qr.step1': 'Abra o aplicativo no celular.',
  'c3.device.qr.step2': 'Toque em Aparelhos conectados e depois em Conectar um aparelho.',
  'c3.device.qr.step3': 'Aponte a câmera do celular para este código.',
  'c3.device.useCode': 'Usar código em vez de QR',
  'c3.device.useQr': 'Usar QR Code',
  'c3.device.phone.title': 'Informe o número do celular',
  'c3.device.phone': 'Número do celular com DDD',
  'c3.device.phone.help': 'O mesmo número do aplicativo, com o código do país (55 no Brasil).',
  'c3.device.phone.invalid': 'Digite de 10 a 15 dígitos, com o código do país.',
  'c3.device.requestCode': 'Pedir código',
  'c3.device.code.title': 'Digite este código no celular',
  'c3.device.code.label': 'Código de pareamento',
  'c3.device.code.step1': 'Abra o aplicativo no celular e toque em Aparelhos conectados.',
  'c3.device.code.step2': 'Toque em Conectar um aparelho e depois em Conectar com número de telefone.',
  'c3.device.code.step3': 'Digite o código abaixo.',
  'c3.device.copy': 'Copiar código',
  'c3.device.copied': 'Código copiado',
  'c3.device.connected': 'Aparelho conectado',
  'c3.device.connectedAs': 'Conectado como {account}.',
  'c3.device.loggedOut': 'Aparelho desconectado',
  'c3.device.loggedOut.hint': 'O aparelho saiu pelo celular ou a sessão expirou. Ligue de novo para voltar a receber mensagens.',
  'c3.device.error': 'Não deu para ligar o aparelho',
  'c3.device.error.hint': 'Confira a internet do celular e do computador e tente de novo.',
  'c3.device.retry': 'Tentar de novo',
  'c3.device.cancel': 'Cancelar',
  'c3.access.title': 'Pedidos de acesso',
  'c3.access.empty': 'Nenhum pedido esperando aprovação.',
  'c3.access.code': 'Código {code}',
  'c3.access.showMessage': 'Ver a primeira mensagem',
  'c3.access.hideMessage': 'Esconder a primeira mensagem',
  'c3.access.noMessage': 'Sem mensagem',
  'c3.access.approve': 'Aprovar',
  'c3.access.reject': 'Recusar',
  'c3.access.approveWho': 'Aprovar {name}',
  'c3.access.rejectWho': 'Recusar {name}',
  'c3.allow.title': 'Liberados e bloqueados',
  'c3.allow.empty': 'Nenhum contato ou grupo na lista.',
  'c3.allow.add': 'Adicionar contato ou grupo',
  'c3.allow.placeholder': 'Telefone com DDD ou ID do grupo',
  'c3.allow.invalid': 'Use o telefone com DDD (10 a 15 dígitos) ou o ID do grupo terminado em @g.us.',
  'c3.allow.duplicate': 'Já está na lista.',
  'c3.allow.allowed': 'Liberado',
  'c3.allow.blocked': 'Bloqueado',
  'c3.allow.contact': 'Contato',
  'c3.allow.group': 'Grupo',
  'c3.allow.block': 'Bloquear {name}',
  'c3.allow.unblock': 'Liberar {name}',
  'c3.allow.remove': 'Tirar {name} da lista'
} as const;

export type DeviceMessageId = keyof typeof PT;

/** Tradução para inglês dos textos de aparelho; usada quando o idioma começa com "en". */
export const DEVICE_MESSAGES_EN: Record<DeviceMessageId, string> = {
  'c3.device.connecting': 'Preparing the connection…',
  'c3.device.qr.title': 'Link the device with the QR code',
  'c3.device.qr.label': 'QR code to link the device',
  'c3.device.qr.renew': 'The code renews itself while this screen is open.',
  'c3.device.qr.step1': 'Open the app on your phone.',
  'c3.device.qr.step2': 'Tap Linked devices, then Link a device.',
  'c3.device.qr.step3': 'Point your phone camera at this code.',
  'c3.device.useCode': 'Use a code instead of QR',
  'c3.device.useQr': 'Use QR code',
  'c3.device.phone.title': 'Enter the phone number',
  'c3.device.phone': 'Phone number with area code',
  'c3.device.phone.help': 'The same number as the app, with the country code.',
  'c3.device.phone.invalid': 'Type 10 to 15 digits, including the country code.',
  'c3.device.requestCode': 'Get code',
  'c3.device.code.title': 'Type this code on your phone',
  'c3.device.code.label': 'Pairing code',
  'c3.device.code.step1': 'Open the app on your phone and tap Linked devices.',
  'c3.device.code.step2': 'Tap Link a device, then Link with phone number instead.',
  'c3.device.code.step3': 'Type the code below.',
  'c3.device.copy': 'Copy code',
  'c3.device.copied': 'Code copied',
  'c3.device.connected': 'Device linked',
  'c3.device.connectedAs': 'Linked as {account}.',
  'c3.device.loggedOut': 'Device logged out',
  'c3.device.loggedOut.hint': 'The device was unlinked from the phone or the session expired. Link it again to keep receiving messages.',
  'c3.device.error': 'Could not link the device',
  'c3.device.error.hint': 'Check the internet on the phone and on this computer, then try again.',
  'c3.device.retry': 'Try again',
  'c3.device.cancel': 'Cancel',
  'c3.access.title': 'Access requests',
  'c3.access.empty': 'No requests waiting for approval.',
  'c3.access.code': 'Code {code}',
  'c3.access.showMessage': 'Show the first message',
  'c3.access.hideMessage': 'Hide the first message',
  'c3.access.noMessage': 'No message',
  'c3.access.approve': 'Approve',
  'c3.access.reject': 'Decline',
  'c3.access.approveWho': 'Approve {name}',
  'c3.access.rejectWho': 'Decline {name}',
  'c3.allow.title': 'Allowed and blocked',
  'c3.allow.empty': 'No contacts or groups on the list.',
  'c3.allow.add': 'Add contact or group',
  'c3.allow.placeholder': 'Phone with area code or group ID',
  'c3.allow.invalid': 'Use the phone with area code (10 to 15 digits) or the group ID ending in @g.us.',
  'c3.allow.duplicate': 'Already on the list.',
  'c3.allow.allowed': 'Allowed',
  'c3.allow.blocked': 'Blocked',
  'c3.allow.contact': 'Contact',
  'c3.allow.group': 'Group',
  'c3.allow.block': 'Block {name}',
  'c3.allow.unblock': 'Allow {name}',
  'c3.allow.remove': 'Remove {name} from the list'
};

/** `t('c3.device.retry')` no idioma atual: mensagem do app, senão a embutida (inglês ou português). */
export function useDeviceText() {
  const intl = useIntl();
  const en = intl.locale.toLowerCase().startsWith('en');
  return useCallback(
    (id: DeviceMessageId, values?: Record<string, string | number>) =>
      intl.formatMessage({ id, defaultMessage: en ? DEVICE_MESSAGES_EN[id] : PT[id] }, values),
    [intl, en]
  );
}
