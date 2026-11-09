import { lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AppFooter, AppLayout, AuthLayout, C3ThemeProvider, Loadable, Notifier } from '@c3theme/ui';
import { AuthProvider, GuestOnly, RequireAuth } from './auth';
import { APP_NAME, HOME_PATH, STORAGE_KEY } from './config';
import Header from './Header';
import { loadMessages, LOCALES } from './locales';
import { useMenu } from './menu';
import { ComingSoonPage, NotFoundPage, ServerErrorPage, UnderConstructionPage } from './pages/maintenance/ErrorPages';

// telas carregadas sob demanda: o login não baixa o código do sistema e vice-versa
const SamplePage = Loadable(lazy(() => import('./pages/SamplePage')));
const ProfilePage = Loadable(lazy(() => import('./pages/ProfilePage')));
const LoginPage = Loadable(lazy(() => import('./pages/auth/LoginPage')));
const RegisterPage = Loadable(lazy(() => import('./pages/auth/RegisterPage')));
const ForgotPasswordPage = Loadable(lazy(() => import('./pages/auth/ForgotPasswordPage')));
const CheckMailPage = Loadable(lazy(() => import('./pages/auth/CheckMailPage')));
const CodeVerificationPage = Loadable(lazy(() => import('./pages/auth/CodeVerificationPage')));
const ResetPasswordPage = Loadable(lazy(() => import('./pages/auth/ResetPasswordPage')));

function MainLayout() {
  const menu = useMenu();
  return (
    <AppLayout menu={menu} header={<Header />} footer={<AppFooter links={[{ label: 'Suporte', href: 'mailto:suporte@exemplo.com' }]} />}>
      <Outlet />
    </AppLayout>
  );
}

function Crash(): never {
  throw new Error('Erro de exemplo para mostrar a página 500.');
}

const router = createBrowserRouter(
  [
    {
      errorElement: <ServerErrorPage />,
      children: [
        {
          element: (
            <GuestOnly>
              <AuthLayout />
            </GuestOnly>
          ),
          children: [
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> },
            { path: 'forgot-password', element: <ForgotPasswordPage /> },
            { path: 'check-mail', element: <CheckMailPage /> },
            { path: 'code-verification', element: <CodeVerificationPage /> },
            { path: 'reset-password', element: <ResetPasswordPage /> }
          ]
        },
        { path: 'manutencao/em-manutencao', element: <UnderConstructionPage /> },
        { path: 'manutencao/em-breve', element: <ComingSoonPage /> },
        { path: 'manutencao/404', element: <NotFoundPage fullScreen /> },
        { path: 'manutencao/500', element: <Crash /> },
        {
          path: '/',
          element: (
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          ),
          children: [
            { index: true, element: <Navigate to={HOME_PATH} replace /> },
            { path: 'inicio', element: <SamplePage /> },
            { path: 'perfil', element: <ProfilePage /> },
            { path: '*', element: <NotFoundPage /> }
          ]
        }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);

export default function App() {
  return (
    <C3ThemeProvider
      branding={{ name: APP_NAME, homePath: HOME_PATH }}
      storageKey={STORAGE_KEY}
      locales={LOCALES}
      loadMessages={loadMessages}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Notifier />
    </C3ThemeProvider>
  );
}
