import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AppFooter, AppLayout, C3ThemeProvider, Notifier } from '@c3theme/ui';
import Header from './Header';
import { loadMessages, LOCALES } from './locales';
import { NotFound, RouteError } from './RouteError';
import { BRAND } from './brand';
import { menu, SECTIONS } from './sections';

const router = createBrowserRouter(
  [
    {
      errorElement: <RouteError />,
      children: [
        ...SECTIONS.flatMap((s) => s.fullScreenRoutes ?? []),
        {
          path: '/',
          element: <AppLayout menu={menu} header={<Header />} footer={<AppFooter />} />,
          children: [
            { index: true, element: <Navigate to="/dashboard/padrao" replace /> },
            ...SECTIONS.flatMap((s) => s.routes),
            { path: '*', element: <NotFound /> }
          ]
        }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);

export default function App() {
  return (
    <C3ThemeProvider branding={BRAND} storageKey="c3-showcase" locales={LOCALES} loadMessages={loadMessages}>
      <RouterProvider router={router} />
      <Notifier />
    </C3ThemeProvider>
  );
}
