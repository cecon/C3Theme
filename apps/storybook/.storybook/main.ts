import type { StorybookConfig } from '@storybook/react-vite';
import { defaultClientConditions } from 'vite';

// Catálogo dos componentes do C3. O que o motor consegue montar vem da spec (src/motor/spec) pelo @c3theme/engine;
// o resto (tag `uso-direto`) usa o componente direto.
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  // @c3theme/* do workspace pelo fonte, como na vitrine: a mudança no componente aparece sem rebuild do pacote
  viteFinal: (vite) => ({
    ...vite,
    resolve: { ...vite.resolve, conditions: ['c3theme-source', ...defaultClientConditions] },
    build: {
      ...vite.build,
      rolldownOptions: {
        ...vite.build?.rolldownOptions,
        // o 'use client' do MUI não importa fora do React Server Components; sem isso o build vira uma parede de avisos
        onwarn: (warning, warn) => {
          if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning);
        }
      }
    }
  })
};

export default config;
