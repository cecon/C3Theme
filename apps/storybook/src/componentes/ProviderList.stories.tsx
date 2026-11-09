import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';

import { ProviderList, SoftAvatar, type ProviderItem, type Tone } from '@c3theme/ui';

const logo = (letters: string, tone: Tone) => (
  <SoftAvatar size="md" tone={tone}>
    {letters}
  </SoftAvatar>
);

/** Todos os estados na mesma lista. */
const TODOS: ProviderItem[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    icon: logo('CC', 'warning'),
    status: 'ready',
    detail: 'v2.1.4 · C:\\Users\\ana\\.local\\bin\\claude.exe'
  },
  { id: 'codex', name: 'Codex', icon: logo('CX', 'neutral'), status: 'needs-login', detail: 'v0.48.0 · instalado pelo npm' },
  { id: 'opencode', name: 'OpenCode', icon: logo('OC', 'info'), status: 'missing', detail: 'Baixa o instalador oficial (38 MB)' },
  { id: 'ollama', name: 'Ollama', icon: logo('OL', 'success'), status: 'installing', progress: 42, detail: 'Baixando 1,2 GB' },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    icon: logo('LM', 'primary'),
    status: 'error',
    error: 'Sem espaço no disco C:. Libere 2 GB e tente de novo.'
  },
  { id: 'gemini', name: 'Gemini CLI', status: 'signing-in', detail: 'Termine o login no navegador que abriu' },
  { id: 'aider', name: 'Aider', status: 'installed', detail: 'v0.86 · não precisa de login' }
];

const meta = {
  title: 'Componentes/ProviderList',
  component: ProviderList,
  decorators: [(Story) => <Box sx={{ maxWidth: 640 }}>{Story()}</Box>],
  args: {
    providers: TODOS,
    label: 'Programas de IA',
    refreshing: false,
    onInstall: fn(),
    onSignIn: fn(),
    onRetry: fn(),
    onRefresh: fn(),
    onCheckUpdate: fn(),
    onRemove: fn()
  }
} satisfies Meta<typeof ProviderList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TodosOsEstados: Story = { name: 'Todos os estados' };

export const Procurando: Story = { args: { refreshing: true } };

/** Instalador que não informa o tamanho: barra indeterminada. */
export const SemTamanho: Story = {
  name: 'Sem tamanho',
  args: { providers: [{ id: 'ollama', name: 'Ollama', status: 'installing', detail: 'Baixando…' }] }
};

export const Vazia: Story = { args: { providers: [] } };

/** Simula o app: "Baixar" sobe o progresso até instalar, "Entrar" passa por entrando até pronto. */
export const Simulacao: Story = {
  name: 'Simulação',
  args: {
    providers: TODOS.map((p) =>
      p.status === 'installing' || p.status === 'signing-in' ? { ...p, status: 'missing', progress: undefined } : p
    )
  },
  render: function Render(args) {
    const [list, setList] = useState(args.providers);
    const set = (id: string, patch: Partial<ProviderItem>) => setList((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    useEffect(() => {
      const timer = setInterval(() => {
        setList((l) =>
          l.map((p) => {
            if (p.status === 'installing') {
              const next = (p.progress ?? 0) + 7;
              return next >= 100
                ? { ...p, status: 'needs-login', progress: undefined, detail: 'v1.0 · recém-instalado' }
                : { ...p, progress: next };
            }
            return p.status === 'signing-in' ? { ...p, status: 'ready' } : p;
          })
        );
      }, 600);
      return () => clearInterval(timer);
    }, []);
    return (
      <ProviderList
        {...args}
        providers={list}
        onInstall={(id) => set(id, { status: 'installing', progress: 0 })}
        onSignIn={(id) => set(id, { status: 'signing-in' })}
        onRetry={(id) => set(id, { status: 'installing', progress: 0, error: undefined })}
        onRemove={(id) => set(id, { status: 'missing' })}
      />
    );
  }
};
