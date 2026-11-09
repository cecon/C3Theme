import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// renderer: aberto de arquivo (file://) pelo main, então os caminhos dos assets são relativos
export default defineConfig({
  base: './',
  resolve: { conditions: ['c3theme-source', ...defaultClientConditions] },
  build: { outDir: 'dist' },
  plugins: [react()]
});
