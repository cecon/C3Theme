import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Panel, ThreadTabs, type ThreadTab, type ThreadTabsProps } from '@c3theme/ui';

// O componente sozinho (#134): os dados e o efeito de cada ação são do app. Na casca, quem liga é o `chat.tabs` da
// spec (Telas/Abas das threads).
const start: ThreadTab[] = [
  { id: 'main', label: 'Principal', closable: false },
  { id: 'a', label: 'Pesquisa de preços', state: 'running' },
  { id: 'b', label: 'Revisão do contrato', state: 'waiting' },
  { id: 'c', label: 'Resumo da semana', state: 'unread' },
  { id: 'd', label: 'Publicar versão', state: 'failed' },
  { id: 'e', label: 'Thread antiga', disabled: 'Arquivada em outro aparelho' }
];
function Demo(props: Partial<ThreadTabsProps>) {
  const [tabs, setTabs] = useState(props.tabs ?? start);
  const [active, setActive] = useState('main');
  const [closed, setClosed] = useState<{ id: string; label: string }[]>([]);
  const close = (id: string) => {
    const tab = tabs.find((t) => t.id === id)!;
    setTabs((ts) => ts.filter((t) => t.id !== id));
    setClosed((c) => [...c, { id, label: tab.label }]);
    if (id === active) setActive('main');
  };
  return (
    <Panel title="Conversa" sx={{ maxWidth: 760 }}>
      <ThreadTabs
        label="Threads da conversa"
        active={active}
        onSelect={setActive}
        onNew={() => {
          const id = `n${tabs.length}`;
          setTabs((ts) => [...ts, { id, label: 'Nova thread' }]);
          setActive(id);
        }}
        onClose={close}
        onCloseOthers={(id) => tabs.filter((t) => t.id !== id && t.closable !== false).forEach((t) => close(t.id))}
        onRename={(id, label) => setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, label } : t)))}
        onReorder={(ids) => setTabs(ids.map((id) => tabs.find((t) => t.id === id)!))}
        closed={closed}
        onReopen={(id) => {
          setTabs((ts) => [...ts, { id, label: closed.find((c) => c.id === id)!.label }]);
          setClosed((c) => c.filter((x) => x.id !== id));
          setActive(id);
        }}
        {...props}
        tabs={tabs}
      />
    </Panel>
  );
}
const meta = {
  title: 'Componentes/Abas de threads',
  component: Demo,
  parameters: {
    docs: {
      description: {
        component:
          'Faixa de abas das threads: setas, Home e End trocam; Delete fecha; F2 renomeia; Shift+F10 abre o menu; arrastar reordena. Estado vai no nome acessível e tem forma própria (não só cor).'
      }
    }
  }
} satisfies Meta<typeof Demo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Completa: Story = {};
export const MuitasAbas: Story = {
  args: { tabs: [...start, ...Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, label: `Investigação ${i + 1}` }))] }
};
export const SoAPrincipal: Story = { args: { tabs: [start[0]] } };
export const Carregando: Story = { args: { loading: true } };
export const Erro: Story = { args: { error: 'Não deu para abrir as threads.', onRetry: fn() } };
