import { lazy, useMemo } from 'react';
import { Navigate, RouteObject, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AuthLayout, Loadable } from '@c3theme/ui';
import { createShellRouter, type RouterMode } from '../router';
import { canRecover, canRegister, modoDeEntrada, type AuthConfig, type AuthPort } from './port';
import { useAuth } from './session';
import LoginPage from './pages/LoginPage';

const RegisterPage = Loadable(lazy(() => import('./pages/RegisterPage')));
const ForgotPasswordPage = Loadable(lazy(() => import('./pages/ForgotPasswordPage')));
const CheckMailPage = Loadable(lazy(() => import('./pages/CheckMailPage')));
const CodeVerificationPage = Loadable(lazy(() => import('./pages/CodeVerificationPage')));
const ResetPasswordPage = Loadable(lazy(() => import('./pages/ResetPasswordPage')));
const CodeLoginPage = Loadable(lazy(() => import('./pages/CodeLoginPage')));
const CodeLoginVerifyPage = Loadable(lazy(() => import('./pages/CodeLoginVerifyPage')));

/** Qualquer endereço sem sessão vai ao login e volta para ele depois de entrar. */
function ToLogin() {
  const { pathname, search } = useLocation();
  return <Navigate to="/login" replace state={{ from: pathname + search }} />;
}

/**
 * Telas de entrada (sem usuário). No modo `senha`, as rotas de senha existem só para o que `auth` liga e a porta
 * implementa; no modo `codigo` (#123) só existem a entrada por e-mail e a conferência do código — nenhuma rota de
 * senha (cadastro, esqueci a senha, redefinir) é montada.
 */
/** As rotas de entrada conforme o modo declarado: no modo código não existe nenhuma rota de senha (#123). */
export function rotasDeEntrada(config: AuthConfig, port: AuthPort): RouteObject[] {
  const entrada = modoDeEntrada(port);
  if (entrada === undefined) {
    throw new Error('A porta de autenticação não declara entrada por senha nem por código.');
  }
  return entrada === 'codigo'
    ? [
        { path: 'login', element: <CodeLoginPage /> },
        { path: 'codigo', element: <CodeLoginVerifyPage /> }
      ]
    : [
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
}

export default function AuthScreens({ basename, router: mode = 'browser' }: { basename?: string; router?: RouterMode }) {
  const { config, port } = useAuth();
  const router = useMemo(() => {
    const routes = rotasDeEntrada(config, port);
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
