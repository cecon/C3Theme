import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { AppLayout, desktopTokens, NotificationsButton, Panel, SettingsButton, type DesktopOptions } from '@c3theme/ui';
import { MENU } from './menu';
import { AVISOS } from './avisos';
import WindowFrame from './WindowFrame';

const USER = { name: 'Ana Souza', email: 'ana@exemplo.com', role: 'Financeiro', onLogout: fn() };

interface ShellProps {
  userPlacement: 'header' | 'drawer';
  desktop?: DesktopOptions;
}

function Shell({ userPlacement, desktop }: ShellProps) {
  const layout = (
    <AppLayout
      menu={MENU}
      user={USER}
      userPlacement={userPlacement}
      documentTitle={false}
      desktop={desktop}
      header={
        <>
          <NotificationsButton items={AVISOS} onMarkAllRead={fn()} />
          <SettingsButton />
        </>
      }
    >
      <Grid container spacing={3}>
        {['Recebido no mês', 'A receber', 'Atrasado'].map((title) => (
          <Grid key={title} size={{ xs: 12, md: 4 }}>
            <Panel title={title}>
              <Typography variant="h4" component="p">
                R$ 12.480,00
              </Typography>
            </Panel>
          </Grid>
        ))}
      </Grid>
    </AppLayout>
  );
  return desktop ? <WindowFrame platform={desktop.platform}>{layout}</WindowFrame> : layout;
}

/**
 * Estrutura da tela: header, menu (lateral, em barra ou em dois níveis, pela engrenagem), migalhas e conteúdo.
 * No celular o menu vira gaveta: troque o tamanho no botão de viewport.
 *
 * Num sistema C3 o menu vem do app.json: veja "Layout/Shell pelo motor". Aqui o menu é montado em código (uso direto);
 * as histórias de desktop são a moldura da janela, peça a peça; declarar a moldura no app.json é a lacuna cecon/C3Theme#73 (ADR 0003).
 */
const meta = {
  title: 'Layout/AppLayout',
  component: Shell,
  args: { userPlacement: 'header' },
  argTypes: { userPlacement: { control: 'inline-radio', options: ['header', 'drawer'] } },
  parameters: { bare: true, route: '/vendas/faturas', docs: { story: { inline: false, iframeHeight: 560 } } }
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão (uso direto)', tags: ['uso-direto'] };

/** Uso direto: pelo motor, o usuário (`layout.user`) só aparece com a sessão do `auth`, que o Storybook não tem. */
export const UsuarioNoMenu: Story = { name: 'Usuário no pé do menu (uso direto)', tags: ['uso-direto'], args: { userPlacement: 'drawer' } };

// constantes: um objeto novo a cada render recriaria o tema
const MAC_TOKENS = desktopTokens('mac');
const WINDOWS_TOKENS = desktopTokens('windows');

/**
 * Electron no Mac (`titleBarStyle: 'hiddenInset'`, `vibrancy: 'sidebar'`): cabeçalho e topo do menu arrastam a
 * janela, a marca abre espaço para os três botões (tracejado), o menu deixa a janela aparecer (aqui, o degradê) e o
 * tema usa a fonte do sistema e a densidade compacta (`C3ThemeProvider tokens={desktopTokens('mac')}`). Recolha o
 * menu ou troque para dois níveis na engrenagem: a marca desce para baixo dos botões.
 */
export const DesktopMac: Story = {
  name: 'App de desktop: Mac',
  args: { desktop: { platform: 'mac', translucent: true } },
  parameters: { tokens: MAC_TOKENS }
};

/**
 * Electron no Windows (`titleBarOverlay`): os botões da janela ficam à direita do cabeçalho, que recua para eles.
 * Menu com 60% do fundo, para o `backgroundMaterial: 'mica'` aparecer de leve.
 */
export const DesktopWindows: Story = {
  name: 'App de desktop: Windows',
  args: { desktop: { platform: 'windows', translucent: 0.6 } },
  parameters: { tokens: WINDOWS_TOKENS }
};

/**
 * Janela do app de desktop estreitada para 900 px: o menu continua fixo (`desktop.drawerFrom`, padrão 720 px), e
 * não vira gaveta como no site (que troca no `lg`, 1200 px). Abaixo do limite volta o botão de menu com a gaveta.
 */
export const DesktopJanelaEstreita: Story = {
  name: 'App de desktop: janela de 900 px',
  args: { desktop: { platform: 'mac' } },
  parameters: {
    tokens: MAC_TOKENS,
    viewport: { options: { janela900: { name: 'Janela de 900 px', styles: { width: '900px', height: '640px' } } } }
  },
  globals: { viewport: { value: 'janela900', isRotated: false } }
};
