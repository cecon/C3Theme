import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router';

// third-party
import { Danger, DocumentText, Global, Lock, MessageQuestion, Tag2 } from 'iconsax-reactjs';

import { Loadable, NavItem } from '@c3theme/ui';
import type { Section } from '../../section';
import type { AuthScreen } from './auth/fields';

type Screens = typeof import('./auth/screens');
const screen = (name: keyof Screens) => Loadable(lazy(() => import('./auth/screens').then((m) => ({ default: m[name] }))));

const SCREENS: { path: AuthScreen; title: string; Component: ReturnType<typeof screen> }[] = [
  { path: 'login', title: 'Login', Component: screen('Login') },
  { path: 'cadastro', title: 'Cadastro', Component: screen('Register') },
  { path: 'esqueci-senha', title: 'Esqueci a senha', Component: screen('ForgotPassword') },
  { path: 'confira-email', title: 'Confira o e-mail', Component: screen('CheckMail') },
  { path: 'codigo-verificacao', title: 'Código de verificação', Component: screen('CodeVerification') },
  { path: 'nova-senha', title: 'Nova senha', Component: screen('ResetPassword') }
];

const AuthStyle1 = Loadable(lazy(() => import('./auth/Estilo1')));
const AuthStyle2 = Loadable(lazy(() => import('./auth/Estilo2')));
const AuthStyle3 = Loadable(lazy(() => import('./auth/Estilo3')));
const NotFound = Loadable(lazy(() => import('./manutencao/Erro404')));
const ServerError = Loadable(lazy(() => import('./manutencao/Erro500')));
const Maintenance = Loadable(lazy(() => import('./manutencao/Manutencao1')));
const Maintenance2 = Loadable(lazy(() => import('./manutencao/Manutencao2')));
const ComingSoon = Loadable(lazy(() => import('./manutencao/EmBreve1')));
const ComingSoon2 = Loadable(lazy(() => import('./manutencao/EmBreve2')));
const Landing = Loadable(lazy(() => import('./publico/Landing')));
const Contact = Loadable(lazy(() => import('./publico/Contato')));
const Pricing = Loadable(lazy(() => import('./precos/Precos1')));
const Pricing2 = Loadable(lazy(() => import('./precos/Precos2')));
const Sample = Loadable(lazy(() => import('./precos/Exemplo')));

const authRoutes = (base: string, Layout: ReturnType<typeof screen>, screens = SCREENS): RouteObject => ({
  path: base,
  Component: Layout,
  children: [{ index: true, element: <Navigate to="login" replace /> }, ...screens.map(({ path, Component }) => ({ path, Component }))]
});

const authMenu = (id: string, title: string, base: string, screens = SCREENS): NavItem => ({
  id,
  title,
  children: screens.map((s) => ({ id: `${id}-${s.path}`, title: s.title, url: `/${base}/${s.path}` }))
});

const items: NavItem[] = [
  {
    id: 'paginas-auth',
    title: 'Autenticação',
    icon: Lock,
    children: [
      authMenu('auth1', 'Estilo 1 (cartão)', 'paginas/auth'),
      authMenu('auth2', 'Estilo 2 (ilustrado)', 'paginas/auth2'),
      { id: 'auth3-login', title: 'Estilo 3 (tela dividida)', url: '/paginas/auth3/login' }
    ]
  },
  {
    id: 'paginas-manutencao',
    title: 'Manutenção',
    icon: Danger,
    children: [
      { id: 'erro-404', title: 'Erro 404', url: '/paginas/erro-404' },
      { id: 'erro-500', title: 'Erro 500', url: '/paginas/erro-500' },
      { id: 'manutencao-1', title: 'Em manutenção', url: '/paginas/manutencao' },
      { id: 'manutencao-2', title: 'Em manutenção 2', url: '/paginas/manutencao-2' },
      { id: 'em-breve-1', title: 'Em breve', url: '/paginas/em-breve' },
      { id: 'em-breve-2', title: 'Em breve 2', url: '/paginas/em-breve-2' }
    ]
  },
  {
    id: 'paginas-precos',
    title: 'Preços',
    icon: Tag2,
    children: [
      { id: 'precos-1', title: 'Planos em cartões', url: '/paginas/precos' },
      { id: 'precos-2', title: 'Planos com comparativo', url: '/paginas/precos-2' }
    ]
  },
  { id: 'paginas-landing', title: 'Landing page', icon: Global, url: '/paginas/landing' },
  { id: 'paginas-contato', title: 'Fale conosco', icon: MessageQuestion, url: '/paginas/fale-conosco' },
  { id: 'paginas-exemplo', title: 'Página de exemplo', icon: DocumentText, url: '/paginas/exemplo' }
];

export const section: Section = {
  menu: { id: 'pages', title: 'Páginas', items },
  routes: [
    { path: 'paginas/precos', Component: Pricing },
    { path: 'paginas/precos-2', Component: Pricing2 },
    { path: 'paginas/exemplo', Component: Sample }
  ],
  fullScreenRoutes: [
    authRoutes('paginas/auth', AuthStyle1),
    authRoutes('paginas/auth2', AuthStyle2),
    authRoutes('paginas/auth3', AuthStyle3, SCREENS.slice(0, 1)),
    { path: 'paginas/erro-404', Component: NotFound },
    { path: 'paginas/erro-500', Component: ServerError },
    { path: 'paginas/manutencao', Component: Maintenance },
    { path: 'paginas/manutencao-2', Component: Maintenance2 },
    { path: 'paginas/em-breve', Component: ComingSoon },
    { path: 'paginas/em-breve-2', Component: ComingSoon2 },
    { path: 'paginas/landing', Component: Landing },
    { path: 'paginas/fale-conosco', Component: Contact }
  ]
};
