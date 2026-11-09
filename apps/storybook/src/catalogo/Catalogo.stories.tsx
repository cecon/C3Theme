import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';

import { Markdown } from '@c3theme/chat';
import { CatalogCard, CatalogDetail, CatalogGrid, type CatalogItem, type CatalogStatus } from '@c3theme/ui';
import { ITENS } from './itens';

const actions = { onInstall: fn(), onUpdate: fn(), onOpen: fn(), onRetry: fn(), onRemove: fn() };
const markdown = (md: string) => <Markdown text={md} />;

const meta = {
  title: 'Componentes/Catálogo',
  component: CatalogGrid,
  args: { items: ITENS, actions },
  parameters: { layout: 'padded' }
} satisfies Meta<typeof CatalogGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Loja que funciona: instalar e atualizar andam até "Instalado"; "Detalhes" abre o diálogo. */
export const GradeMista: Story = {
  name: 'Grade mista',
  render: function Render(args) {
    const [items, setItems] = useState(args.items);
    const [open, setOpen] = useState<string | null>(null);
    const set = (id: string, status: CatalogStatus) => setItems((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
    const install = (item: CatalogItem) => set(item.id, { state: 'installing', progress: 0 });
    useEffect(() => {
      const timer = setInterval(() => {
        setItems((list) =>
          list.map((i) => {
            if (i.status.state !== 'installing' || i.id === 'ler-pdf') return i;
            const progress = (i.status.progress ?? 0) + 25;
            return { ...i, status: progress >= 100 ? { state: 'installed' } : { state: 'installing', progress } };
          })
        );
      }, 600);
      return () => clearInterval(timer);
    }, []);
    const handlers = { ...args.actions, onInstall: install, onUpdate: install, onRetry: install };
    return (
      <>
        <CatalogGrid {...args} items={items} actions={handlers} onSelect={(i) => setOpen(i.id)} />
        <CatalogDetail
          item={items.find((i) => i.id === open) ?? null}
          onClose={() => setOpen(null)}
          actions={handlers}
          renderMarkdown={markdown}
        />
      </>
    );
  }
};

export const PorCategoria: Story = { name: 'Agrupada por categoria', args: { groupByCategory: true } };

/** Um cartão por estado, na ordem: disponível, instalando, instalado, atualização, saiu do catálogo, erro. */
export const Estados: Story = {
  render: (args) => {
    const order = ['vendedor', 'ler-pdf', 'planilhas', 'atendente-clinica', 'agenda-antiga', 'whatsapp'];
    return (
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))' }}>
        {order.map((id) => (
          <CatalogCard key={id} item={ITENS.find((i) => i.id === id)!} actions={args.actions} onSelect={fn()} />
        ))}
      </Box>
    );
  }
};

/** Janela no mínimo de 900 px (menos o menu do app): duas colunas. */
export const Em900px: Story = {
  name: 'Em 900 px',
  render: (args) => (
    <Box sx={{ width: 900 - 280, maxWidth: '100%' }}>
      <CatalogGrid {...args} onSelect={fn()} />
    </Box>
  )
};

/** Atualização com arquivo editado à mão: aviso do ".nova", o que instala e o histórico. */
export const Detalhe: Story = {
  render: (args) => <CatalogDetail item={ITENS[0]!} onClose={fn()} actions={args.actions} renderMarkdown={markdown} />,
  parameters: { docs: { story: { inline: false, iframeHeight: 640 } } }
};

export const DetalheComErro: Story = {
  name: 'Detalhe com erro',
  render: (args) => <CatalogDetail item={ITENS.find((i) => i.id === 'whatsapp')!} onClose={fn()} actions={args.actions} />,
  parameters: { docs: { story: { inline: false, iframeHeight: 420 } } }
};

/**
 * Loja do Piecework com ações por tipo (`actions={{ agent, skill, app }}`): o agente se contrata quantas vezes quiser
 * (`actionLabel` "Contratar" e, com um na equipe, "Contratar outro"); a habilidade instalada não tem "Abrir" (só sai
 * pelo detalhe, em "Remover"); o app só abre. O nome do botão para o leitor de tela é a ação e o item.
 */
export const AcoesPorTipo: Story = {
  name: 'Ações por tipo',
  render: function Render() {
    const [hired, setHired] = useState(0);
    const [open, setOpen] = useState<string | null>(null);
    const items: CatalogItem[] = [
      { ...ITENS.find((i) => i.id === 'vendedor')!, status: { state: 'available' }, actionLabel: hired ? 'Contratar outro' : 'Contratar' },
      { ...ITENS.find((i) => i.id === 'planilhas')!, status: { state: 'installed' } },
      { ...ITENS.find((i) => i.id === 'whatsapp')!, status: { state: 'installed' } }
    ];
    const byKind = {
      agent: { onInstall: () => setHired((n) => n + 1) },
      skill: { onInstall: fn(), onUpdate: fn(), onRemove: fn() },
      app: { onOpen: fn() }
    };
    return (
      <>
        <CatalogGrid items={items} actions={byKind} onSelect={(i) => setOpen(i.id)} />
        <CatalogDetail
          item={items.find((i) => i.id === open) ?? null}
          onClose={() => setOpen(null)}
          actions={byKind}
          renderMarkdown={markdown}
        />
      </>
    );
  }
};
