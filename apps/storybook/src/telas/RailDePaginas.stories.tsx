import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { C3Shell, type AppDef, type C3Fetch } from '@c3theme/engine';
import { FillHeight, railStorageKey } from '@c3theme/ui';
import { useLocation } from 'react-router';

const storageKey = railStorageKey('Equipe de testes');
function Page() {
  const location = useLocation();
  return (
    <FillHeight>
      <p>Página aberta: {location.pathname}</p>
      <input aria-label="Rascunho" />
    </FillHeight>
  );
}
const components = { Page };
function Demo({
  collapsed = false,
  conditionalAbsent = false,
  mac = false
}: {
  collapsed?: boolean;
  conditionalAbsent?: boolean;
  mac?: boolean;
}) {
  useState(() => {
    window.history.replaceState(null, '', '#/usage');
    if (collapsed) localStorage.setItem(storageKey, JSON.stringify({ pagesCollapsed: true }));
  });
  const [loadingNotes, setLoadingNotes] = useState(true);
  const transport = useMemo<C3Fetch>(() => {
    const app: AppDef = {
      name: 'Equipe de testes',
      entities: [],
      homePath: '/agents',
      pages: [
        { path: '/agents', title: 'Agentes', component: 'Page' },
        { path: '/usage', title: 'Uso', component: 'Page' },
        { path: '/billing', title: 'Cobrança', component: 'Page', permission: 'billing.read' }
      ],
      layout: {
        menu: [{ items: [{ path: '/agents' }, { path: '/usage' }, { path: '/billing' }] }],
        rails: { pages: {} },
        footer: null,
        header: { search: false, fullscreen: false, settings: false }
      }
    };
    return async (url) =>
      url.endsWith('/_meta/app')
        ? new Response(JSON.stringify({ data: app, pages: { '/billing': !conditionalAbsent } }), {
            headers: { 'content-type': 'application/json' }
          })
        : new Response('{}', { status: 404 });
  }, [conditionalAbsent]);
  return (
    <C3Shell
      apiUrl="/pages-rail-demo"
      router="hash"
      transport={transport}
      icons={{}}
      components={components}
      {...(mac && { desktop: { platform: 'mac' } })}
      rails={{
        pages: {
          help: {
            version: '1.2.3',
            loadingNotes,
            releaseNotes: loadingNotes ? undefined : 'Melhorias da equipe disponíveis.',
            links: [
              { label: 'Guia', href: 'https://example.org/guide' },
              { label: 'Registro de mudanças', href: 'https://example.org/changelog' }
            ]
          },
          onHelpOpen: () => {
            setTimeout(() => setLoadingNotes(false), 300);
          },
          onSettingsClick: () => {
            window.location.hash = '/agents';
          },
          settingsBadge: true
        }
      }}
    />
  );
}
const meta = {
  title: 'Telas/Rail de páginas',
  component: Demo,
  parameters: { bare: true, router: false, layout: 'fullscreen' }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Recolhido: Story = { args: { collapsed: true } };
export const SemPaginaOpcional: Story = { args: { conditionalAbsent: true } };
export const ControlesDoMac: Story = { args: { mac: true } };
