import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';

// third-party
import { Profile, Setting2 } from 'iconsax-reactjs';

import {
  ColorModeButton,
  CommandSearch,
  FullscreenButton,
  NotificationItem,
  NotificationsButton,
  SettingsButton,
  UserMenu
} from '@c3theme/ui';

const INITIAL: NotificationItem[] = [
  { id: '1', title: 'Novo pedido #1042', description: 'R$ 1.280,00 · Loja Centro', time: 'há 5 min', tone: 'success' },
  { id: '2', title: 'Estoque baixo', description: '3 produtos abaixo do mínimo.', time: 'há 1 h', tone: 'warning' },
  { id: '3', title: 'Fatura INV-0098 vencida', time: 'ontem', tone: 'danger', read: true }
];

export default function Header() {
  const [items, setItems] = useState(INITIAL);
  return (
    <>
      <CommandSearch />
      <NotificationsButton
        items={items}
        onItemClick={(n) => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
        onMarkAllRead={() => setItems((l) => l.map((x) => ({ ...x, read: true })))}
      />
      <ColorModeButton />
      {/* no celular a tela já é cheia e o cabeçalho não tem espaço para sete botões */}
      <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>
        <FullscreenButton />
      </Box>
      <SettingsButton />
      <UserMenu
        name="Ana Souza"
        email="ana@c3theme.dev"
        role="Gerente"
        items={[
          { label: 'Meu perfil', icon: Profile, to: '/apps/perfil/usuario' },
          { label: 'Configurações da conta', icon: Setting2, to: '/apps/perfil/conta' }
        ]}
        onLogout={() => window.location.assign(`${import.meta.env.BASE_URL}paginas/auth/login`)}
      />
    </>
  );
}
