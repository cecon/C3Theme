import { defaultClientConditions, defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_APP_BASE_NAME || '/',
    server: { port: Number(process.env.PORT) || 3003, host: true },
    // @c3theme/* do workspace pelo fonte (fora dele, o pacote instalado entrega o dist)
    resolve: { conditions: ['c3theme-source', ...defaultClientConditions] },
    plugins: [react()]
  };
});
