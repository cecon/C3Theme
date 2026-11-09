import { defaultClientConditions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// a API (e as telas, em GET /api/_meta) vêm do backend do sistema: {{api}}
const api = process.env.C3_API ?? 'http://127.0.0.1:3001';

export default defineConfig({
  server: { port: Number(process.env.PORT) || 5173, host: true, proxy: { '/api': api } },
  // @c3theme/* do workspace pelo fonte (fora dele, o pacote instalado entrega o dist)
  resolve: { conditions: ['c3theme-source', ...defaultClientConditions] },
  plugins: [react()]
});
