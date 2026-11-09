import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { SettingsPanel } from '@c3theme/ui';
import { BarSettings, DockSettings, SECTIONS, SectionContent } from './configuracoes';

/**
 * Uso direto. O motor monta configuração como entidade `singleton` (um formulário); o painel de preferências com
 * seções, switches que valem na hora e linhas dependentes ainda não sai da spec.
 */
const meta = {
  title: 'Componentes/Configurações (uso direto)',
  tags: ['uso-direto'],
  component: SettingsPanel,
  args: { title: 'Configurações', open: true, onClose: fn(), children: null },
  argTypes: { systemFont: { control: 'boolean' }, variant: { control: 'inline-radio', options: ['dialog', 'window'] } },
  // o diálogo cobre a página: na documentação cada história fica no seu quadro
  parameters: { docs: { story: { inline: false, iframeHeight: 680 } } }
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Diálogo modal com as seções à esquerda (o atalho Ctrl+, / Cmd+, que abre fica com o app). Cada mudança vale na hora, sem botão de salvar. */
export const Dialogo: Story = {
  name: 'Diálogo com seções',
  render: function Render(args) {
    const [open, setOpen] = useState(args.open);
    const [section, setSection] = useState('agentes');
    return (
      <>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Abrir configurações
        </Button>
        <SettingsPanel
          {...args}
          open={open}
          onClose={() => {
            setOpen(false);
            args.onClose?.();
          }}
          sections={SECTIONS}
          section={section}
          onSectionChange={setSection}
        >
          <SectionContent section={section} />
        </SettingsPanel>
      </>
    );
  }
};

/** Janela própria do Electron: o painel ocupa o contêiner inteiro, com a fonte do sistema. */
export const Janela: Story = {
  name: 'Janela própria',
  args: { variant: 'window', systemFont: true },
  render: function Render(args) {
    const [section, setSection] = useState('tela');
    return (
      <Box sx={{ height: 600, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <SettingsPanel {...args} sections={SECTIONS} section={section} onSectionChange={setSection}>
          <SectionContent section={section} />
        </SettingsPanel>
      </Box>
    );
  }
};

/** Uma seção só: sem navegação, os grupos um embaixo do outro. */
export const SemSecoes: Story = {
  name: 'Sem seções',
  render: (args) => (
    <SettingsPanel {...args}>
      <DockSettings />
      <BarSettings />
    </SettingsPanel>
  )
};

/** Switch principal desligado: as linhas dependentes ficam desabilitadas, mas continuam à vista. */
export const Dependentes: Story = {
  name: 'Linhas dependentes desligadas',
  args: { variant: 'window' },
  render: (args) => (
    <Box sx={{ height: 600 }}>
      <SettingsPanel {...args}>
        <DockSettings initialOn={false} />
      </SettingsPanel>
    </Box>
  )
};
