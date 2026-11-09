import { useState } from 'react';
import { useNavigate } from 'react-router';

// third-party
import { DocumentText, Profile, Setting2, TickCircle, Warning2 } from 'iconsax-reactjs';

import {
  ColorModeButton,
  CommandSearch,
  FullscreenButton,
  NotificationItem,
  NotificationsButton,
  SettingsButton,
  UserMenu
} from '@c3theme/ui';
import { useAuth } from './auth';

// exemplo: num sistema real, venha da API (e de um websocket/SSE para chegar na hora)
const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Pedido #1042 aprovado',
    description: 'O financeiro liberou o pedido.',
    time: 'há 5 min',
    tone: 'success',
    icon: <TickCircle size={16} />
  },
  {
    id: '2',
    title: 'Estoque baixo',
    description: '3 produtos abaixo do mínimo.',
    time: 'há 1 h',
    tone: 'warning',
    icon: <Warning2 size={16} />
  },
  { id: '3', title: 'Relatório mensal disponível', time: 'ontem', tone: 'info', icon: <DocumentText size={16} />, read: true }
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  return (
    <>
      <CommandSearch />
      <NotificationsButton
        items={notifications}
        onItemClick={(n) => setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
        onMarkAllRead={() => setNotifications((list) => list.map((x) => ({ ...x, read: true })))}
      />
      <ColorModeButton />
      <FullscreenButton />
      <SettingsButton />
      {user && (
        <UserMenu
          name={user.name}
          email={user.email}
          role={user.role}
          items={[
            { label: 'Meu perfil', icon: Profile, to: '/perfil' },
            { label: 'Trocar senha', icon: Setting2, to: '/perfil?aba=senha' }
          ]}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
      )}
    </>
  );
}
