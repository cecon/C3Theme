import { Navigate, RouteObject, useNavigate } from 'react-router';

// third-party
import { Profile } from 'iconsax-reactjs';

import type { UserMenuProps } from '@c3theme/ui';
import ProfilePage from './pages/ProfilePage';
import { canProfile } from './port';
import { AuthSession, useAuthSession } from './session';

/** Com login pela shell: /login de quem já entrou volta ao início, e /perfil quando a porta permite. */
export function sessionRoutes(session: AuthSession | null): RouteObject[] {
  if (!session) return [];
  return [
    { path: 'login', element: <Navigate to="/" replace /> },
    ...(canProfile(session.config, session.port) ? [{ path: 'perfil', element: <ProfilePage /> }] : [])
  ];
}

/** Usuário logado para o menu de conta da shell (cabeçalho ou pé do menu): perfil, se houver, e sair. */
export function useSessionUser(): UserMenuProps | undefined {
  const session = useAuthSession();
  const navigate = useNavigate();
  if (!session?.user) return undefined;
  const { user, config, port } = session;
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    items: canProfile(config, port) ? [{ label: 'Meu perfil', icon: Profile, to: '/perfil' }] : [],
    onLogout: () => {
      session.logout();
      navigate('/login');
    }
  };
}
