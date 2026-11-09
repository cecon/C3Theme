import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// a API vem do backend do sistema; por padrão, o c3-example (cargo run -p c3-example)
const api = process.env.C3_API ?? 'http://127.0.0.1:3000';

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
    // Codespaces encaminha a porta por *.app.github.dev
    allowedHosts: ['.app.github.dev'],
    proxy: { '/api': api }
  },
  // @c3theme/* do workspace pelo fonte (fora dele, o pacote instalado entrega o dist)
  resolve: { conditions: ['c3theme-source', ...defaultClientConditions] },
  plugins: [react()]
});
