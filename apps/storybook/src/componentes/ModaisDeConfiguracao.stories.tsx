import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import {
  EngineProvider,
  SettingsLauncher,
  SettingsModal,
  type AppDef,
  type AppSettingsDef,
  type EngineState,
  type SettingsDef
} from '@c3theme/engine';
import { SettingsDialog } from '@c3theme/ui';

/**
 * Configurações em modal (#119): a moldura do diálogo, a navegação por abas/seções, a busca por linha, as subpáginas com
 * trilha e voltar, o foco preso e os estados. Tudo vem da spec (`settings` no app.json); os valores e a gravação vêm da
 * porta `settings` do `<C3Shell>`. A referência de comportamento está na issue cecon/C3Theme#119 e na épica
 * cecon/piecework#389; aqui só mostramos o que o motor desenha.
 */

function linha(
  id: string,
  title: string,
  control: SettingsDef['sections'][number]['rows'] extends undefined
    ? never
    : NonNullable<SettingsDef['sections'][number]['rows']>[number]['control']
) {
  return { id, title, description: `${title}: explicação curta`, control };
}

const switcher = (value = false) => ({ type: 'switch' as const, value });

const PESSOAL: AppSettingsDef = {
  title: 'Configurações',
  description: 'Preferências deste app.',
  search: 'Pesquisar configurações…',
  restoreSection: true,
  sections: [
    {
      id: 'geral',
      title: 'Geral',
      description: 'Resumo do app',
      rows: [
        linha('iniciar', 'Abrir ao iniciar', switcher(true)),
        linha('idioma', 'Idioma', {
          type: 'select',
          options: [
            { value: 'pt', label: 'Português' },
            { value: 'en', label: 'English' }
          ]
        })
      ]
    },
    {
      id: 'agentes',
      title: 'Agentes',
      rows: [linha('padrao', 'Agente padrão', { type: 'select', options: [{ value: 'ana', label: 'Ana' }] })]
    },
    { id: 'perfil', title: 'Perfil', rows: [linha('nome', 'Nome', { type: 'text', value: 'Ana' })] },
    {
      id: 'notificacoes',
      title: 'Notificações',
      rows: [linha('som', 'Som das notificações', switcher(true)), linha('aviso', 'Aviso de tarefas', switcher())]
    },
    {
      id: 'voz',
      title: 'Voz',
      rows: [linha('microfone', 'Microfone', { type: 'select', options: [{ value: 'padrao', label: 'Padrão' }] })]
    },
    { id: 'ilha', title: 'Ilha dinâmica', rows: [linha('ilha', 'Mostrar a ilha', switcher())] },
    { id: 'doca', title: 'Dock de agentes', rows: [linha('doca', 'Mostrar o dock', switcher())] },
    { id: 'computador', title: 'Uso do computador', platforms: ['desktop', 'web'], rows: [linha('acesso', 'Acesso à tela', switcher())] },
    { id: 'cobranca', title: 'Cobrança', rows: [linha('plano', 'Plano atual', { type: 'text', value: 'Pro' })] },
    { id: 'celular', title: 'Conectar celular', rows: [linha('parear', 'Parear celular', { type: 'action', label: 'Gerar código' })] },
    {
      id: 'atualizacoes',
      title: 'Atualizações',
      rows: [
        linha('canal', 'Canal', {
          type: 'select',
          options: [
            { value: 'estavel', label: 'Estável' },
            { value: 'beta', label: 'Beta' }
          ]
        })
      ]
    },
    {
      id: 'servidores',
      title: 'Servidores hospedados',
      rows: [{ id: 'abrir-provedor', title: 'Provedor', control: { type: 'page', page: 'provedor', label: 'Abrir' } }],
      pages: [{ id: 'provedor', title: 'Provedor', rows: [linha('chave', 'Chave do provedor', { type: 'text', value: 'sk-…' })] }]
    }
  ],
  server: {
    title: 'Configurações do servidor',
    search: 'Pesquisar configurações do servidor…',
    sections: [
      { id: 'geral', title: 'Geral', rows: [linha('nome', 'Nome do servidor', { type: 'text', value: 'Matriz' })] },
      {
        id: 'personalidade',
        title: 'Personalidade',
        rows: [linha('tom', 'Tom das respostas', { type: 'select', options: [{ value: 'direto', label: 'Direto' }] })]
      },
      { id: 'cofre', title: 'Cofre', rows: [linha('chaves', 'Chaves guardadas', { type: 'text', value: '3' })] },
      { id: 'membros', title: 'Membros', rows: [linha('pessoas', 'Pessoas', { type: 'text', value: '5' })] },
      { id: 'papeis', title: 'Papéis', rows: [linha('dono', 'Dono', { type: 'text', value: 'Ana' })] },
      { id: 'auditoria', title: 'Auditoria', rows: [linha('registros', 'Registros recentes', { type: 'text', value: '120' })] },
      {
        id: 'area-de-trabalho-remota',
        title: 'Área de trabalho',
        platforms: ['desktop'],
        rows: [linha('acesso', 'Quem pode acessar', switcher())]
      },
      {
        id: 'mcp',
        title: 'MCP',
        permission: '/servidor/mcp',
        hideWhenDenied: false,
        rows: [linha('servidores', 'Servidores MCP', switcher())]
      },
      { id: 'armazenamento', title: 'Armazenamento', rows: [linha('uso', 'Espaço usado', { type: 'text', value: '1,2 GB' })] },
      { id: 'sites', title: 'Sites hospedados', rows: [linha('sites', 'Sites', { type: 'text', value: '2' })] },
      {
        id: 'provedores',
        title: 'Provedores',
        rows: [{ id: 'abrir-provedor', title: 'Provedor', control: { type: 'page', page: 'provedor', label: 'Abrir' } }],
        pages: [{ id: 'provedor', title: 'Provedor', rows: [linha('modelos', 'Modelos', { type: 'text', value: 'gpt-5' })] }]
      },
      { id: 'atualizacoes', title: 'Atualizações', rows: [linha('versao', 'Versão instalada', { type: 'text', value: '1.5.0' })] },
      { id: 'importacao', title: 'Importação', rows: [linha('arquivos', 'Arquivos aceitos', { type: 'text', value: 'zip' })] },
      { id: 'transferencia', title: 'Transferência', rows: [linha('destino', 'Destino', { type: 'text', value: '—' })] },
      {
        id: 'rotinas',
        title: 'Rotinas',
        rows: [linha('fuso', 'Fuso do servidor', { type: 'select', options: [{ value: 'sp', label: 'America/Sao_Paulo' }] })]
      },
      { id: 'perfis-do-navegador', title: 'Perfis do navegador', rows: [linha('perfis', 'Perfis', { type: 'text', value: '2' })] }
    ]
  }
};

const PORTA = {
  load: () => Promise.resolve({ values: { som: true }, version: '1.5.0' }),
  change: () => new Promise<void>((resolve) => setTimeout(resolve, 200)),
  action: () => Promise.resolve()
};

const APP: AppDef = { name: 'Storybook', entities: [], layout: { menu: [] }, settings: PESSOAL };

const ESTADO: EngineState = {
  client: {} as EngineState['client'],
  app: APP,
  entities: {},
  components: {},
  icons: {},
  pageAccess: { '/servidor/mcp': false },
  platform: 'desktop'
};

function Envolvido({ children }: { children: React.ReactNode }) {
  return <EngineProvider value={ESTADO}>{children}</EngineProvider>;
}

const meta = {
  title: 'Componentes/Modais de configuração',
  decorators: [
    (Story) => (
      <Envolvido>
        <Story />
      </Envolvido>
    )
  ],
  parameters: { docs: { story: { inline: false, iframeHeight: 760 } } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** As configurações pessoais: o botão do cabeçalho abre o modal com as 12 abas, a busca e o rodapé do servidor. */
export const Pessoal: Story = {
  render: () => (
    <div style={{ padding: 24 }}>
      <SettingsLauncher def={PESSOAL} port={PORTA} />
    </div>
  )
};

/** O modal aberto, para a documentação ver a moldura, as abas e as linhas sem clicar. */
export const PessoalAberto: Story = {
  name: 'Pessoal aberto',
  render: () => <SettingsModal def={PESSOAL} port={PORTA} open onClose={fn()} />
};

/** As configurações do servidor: 16 seções, busca, subpáginas com trilha e voltar e a seção de MCP sem permissão. */
export const Servidor: Story = {
  render: () => <SettingsModal def={PESSOAL.server!} port={PORTA} open scope="server" onClose={fn()} />
};

/** A moldura e os estados do painel (carregando, erro, sem permissão e salvando), sem depender da spec. */
export const Estados: Story = {
  render: () => (
    <SettingsDialog
      open
      title="Configurações"
      description="Ajustes deste app."
      onClose={fn()}
      sections={PESSOAL.sections.slice(0, 3).map((secao) => ({ id: secao.id, label: secao.title as string }))}
      section="geral"
      onSectionChange={fn()}
      status="sem-permissao"
      saving
      version="1.5.0"
    >
      <span />
    </SettingsDialog>
  )
};
