import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { SWRConfig } from 'swr';
import { EngineProvider } from '../../../../packages/engine/src/context';
import AutosaveForm from '../../../../packages/engine/src/pages/AutosaveForm';
import type { C3Client } from '@c3theme/engine';
import type { EntityDef } from '@c3theme/engine';

const def: EntityDef = {
  name: 'preferencias',
  singleton: true,
  label: { singular: 'Minhas configurações', plural: 'Minhas configurações' },
  fields: [
    { name: 'nome', type: 'string', label: 'Nome de exibição', keywords: ['perfil', 'apelido'] },
    { name: 'atalho_chat', type: 'string', component: 'shortcut', label: 'Abrir conversa', keywords: ['chat', 'teclado'] },
    { name: 'atalho_busca', type: 'string', component: 'shortcut', label: 'Abrir busca' },
    {
      name: 'remoto',
      type: 'boolean',
      label: 'Acesso remoto',
      confirmChange: { question: 'Permitir acesso remoto?', effect: 'Outros aparelhos poderão se conectar.' },
      restartNotice: 'Reinicie o aplicativo para aplicar o acesso remoto.'
    },
    { name: 'bandeja', type: 'boolean', label: 'Manter na bandeja' }
  ],
  views: {
    form: {
      autosave: true,
      sections: [
        { tab: 'Perfil', title: 'Identificação', rows: [['nome']] },
        { tab: 'Atalhos', title: 'Teclado', rows: [['atalho_chat'], ['atalho_busca']] },
        { tab: 'Segurança', rows: [['remoto']] },
        { tab: 'Aplicativo', platforms: ['desktop'], rows: [['bandeja']] }
      ]
    }
  }
};
function Demo({ platform }: { platform: 'web' | 'desktop' | 'mobile' }) {
  const client = useMemo(() => {
    let record = { id: '1', _version: '0', nome: 'Ana', atalho_chat: 'Ctrl+K', atalho_busca: 'Ctrl+J', remoto: false, bandeja: true };
    return {
      get: async () => record,
      update: async (_entity: string, _id: string, patch: object) => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        record = { ...record, ...patch, _version: String(Number(record._version) + 1) };
        return record;
      }
    } as unknown as C3Client;
  }, []);
  return (
    <MemoryRouter>
      <SWRConfig value={{ provider: () => new Map() }}>
        <EngineProvider
          value={{
            client,
            platform,
            app: { name: 'Configurações', entities: [], layout: { menu: [] } },
            components: {},
            entities: { preferencias: { def, capabilities: { list: true, read: true, create: false, update: true, delete: false } } }
          }}
        >
          <AutosaveForm entity="preferencias" id="1" />
        </EngineProvider>
      </SWRConfig>
    </MemoryRouter>
  );
}
const meta = {
  title: 'Telas/Configurações com autosave',
  component: Demo,
  parameters: { router: false },
  args: { platform: 'web' }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Web: Story = {};
export const Desktop: Story = { args: { platform: 'desktop' } };
export const Celular: Story = { args: { platform: 'mobile' }, globals: { viewport: { value: 'mobile1' } } };
