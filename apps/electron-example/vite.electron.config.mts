import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

// main e preload em CommonJS para o Node do Electron, um arquivo cada (`--mode main` e `--mode preload`). O preload
// roda em sandbox, que só aceita `require('electron')`: nada de pedaço compartilhado, tudo empacotado nele.
export default defineConfig(({ mode }) => ({
  resolve: { conditions: ['c3theme-source', 'node', 'import', 'default'] },
  build: {
    outDir: 'dist-electron',
    emptyOutDir: mode === 'main',
    target: 'node22',
    minify: false,
    lib: { entry: `electron/${mode}.ts`, formats: ['cjs'], fileName: () => `${mode}.cjs` },
    rolldownOptions: {
      external: ['electron', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)]
    }
  }
}));
