import { lazy, useMemo } from 'react';
import { Navigate, RouteObject, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AuthLayout, Loadable } from '@c3theme/ui';
import { createShellRouter, type RouterMode } from '../router';
import { canRecover, canRegister } from './port';
import { useAuth } from './session';
import LoginPage from './pages/LoginPage';

const RegisterPage = Loadable(lazy(() => import('./pages/RegisterPage')));
const ForgotPasswordPage = Loadable(lazy(() => import('./pages/ForgotPasswordPage')));
const CheckMailPage = Loadable(lazy(() => import('./pages/CheckMailPage')));
const CodeVerificationPage = Loadable(lazy(() => import('./pages/CodeVerificationPage')));
const ResetPasswordPage = Loadable(lazy(() => import('./pages/ResetPasswordPage')));

/** Qualquer endereço sem sessão vai ao login e volta para ele depois de entrar. */
function ToLogin() {
  const { pathname, search } = useLocation();
  return <Navigate to="/login" replace state={{ from: pathname + search }} />;
}

/** Telas de entrada (sem usuário): as rotas existem só para o que `auth` liga e a porta implementa. */
export default function AuthScreens({ basename, router: mode = 'browser' }: { basename?: string; router?: RouterMode }) {
  const { config, port } = useAuth();
  const router = useMemo(() => {
    const routes: RouteObject[] = [
      { path: 'login', element: <LoginPage /> },
      ...(canRegister(config, port) ? [{ path: 'register', element: <RegisterPage /> }] : []),
      ...(canRecover(config, port)
        ? [
            { path: 'forgot-password', element: <ForgotPasswordPage /> },
            { path: 'check-mail', element: <CheckMailPage /> },
            { path: 'code-verification', element: <CodeVerificationPage /> },
            { path: 'reset-password', element: <ResetPasswordPage /> }
          ]
        : [])
    ];
    return createShellRouter(
      mode,
      [
        { element: <AuthLayout />, children: routes },
        { path: '*', element: <ToLogin /> }
      ],
      basename
    );
  }, [config, port, basename, mode]);
  return <RouterProvider router={router} />;
}
