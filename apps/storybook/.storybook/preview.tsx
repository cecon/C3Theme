import type { Preview } from '@storybook/react-vite';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

import { BRAND_COLORS } from '@c3theme/ui';
import { withC3Theme } from './withC3Theme';

// barra de cima do Storybook: visual, cor de marca, claro/escuro, direção e idioma valem para todas as histórias
const preview: Preview = {
  decorators: [withC3Theme],
  globalTypes: {
    look: {
      description: 'Visual do tema',
      toolbar: {
        title: 'Visual',
        icon: 'paintbrush',
        items: [
          { value: 'c3', title: 'C3' },
          { value: 'angle', title: 'Angle' }
        ],
        dynamicTitle: true
      }
    },
    brand: {
      description: 'Cor de marca (só no visual C3)',
      toolbar: { title: 'Marca', icon: 'circle', items: Object.keys(BRAND_COLORS), dynamicTitle: true }
    },
    mode: {
      description: 'Claro ou escuro',
      toolbar: {
        title: 'Modo',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Claro', icon: 'sun' },
          { value: 'dark', title: 'Escuro', icon: 'moon' }
        ],
        dynamicTitle: true
      }
    },
    direction: {
      description: 'Direção do texto',
      toolbar: {
        title: 'Direção',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL' }
        ],
        dynamicTitle: true
      }
    },
    locale: {
      description: 'Idioma dos textos e formatos',
      toolbar: {
        title: 'Idioma',
        icon: 'globe',
        items: [
          { value: 'pt-BR', title: 'Português' },
          { value: 'en-US', title: 'English' }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { look: 'c3', brand: 'blue', mode: 'light', direction: 'ltr', locale: 'pt-BR' },
  parameters: {
    // a margem vem do withC3Theme, pintada com o fundo do tema (o 'padded' do Storybook deixaria uma borda branca no escuro)
    layout: 'fullscreen',
    controls: { expanded: true, matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // o fundo vem do tema (claro/escuro pela barra), não do addon de fundos
    backgrounds: { disable: true },
    // aba Code ao lado de Controles: nas histórias pelo motor ela mostra o JSON da spec, não o JSX
    docs: { codePanel: true },
    // o addon-a11y aponta problemas de contraste e rótulo; 'error' reprova a história que tiver achado do axe
    a11y: { test: 'error' },
    options: {
      storySort: {
        method: 'alphabetical',
        locales: 'pt-BR',
        order: ['Introdução', 'Telas', 'Tema', 'Componentes', 'Campos', 'Tabela', 'Layout', 'Chat', 'Fluxo']
      }
    }
  },
  tags: ['autodocs']
};

export default preview;
