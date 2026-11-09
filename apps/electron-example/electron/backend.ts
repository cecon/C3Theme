// Para onde vão os pedidos do motor, por configuração:
// - C3_API_URL=https://erp.exemplo.com/api  → servidor remoto (o main só repassa);
// - senão, o binário local (C3_BACKEND, padrão o c3-example compilado do repositório), com o banco na pasta do usuário.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { startSidecar } from '@c3theme/electron/main';

export interface Backend {
  apiUrl: string;
  /** O que aparece no título da janela. */
  label: string;
  stop(): void;
}

export async function chooseBackend(env: NodeJS.ProcessEnv, appDir: string, dataDir: string): Promise<Backend> {
  if (env.C3_API_URL) return { apiUrl: env.C3_API_URL, label: env.C3_API_URL, stop: () => {} };
  const exe = process.platform === 'win32' ? 'c3-example.exe' : 'c3-example';
  const command = env.C3_BACKEND ?? resolve(appDir, '../../target/debug', exe);
  if (!existsSync(command)) {
    throw new Error(`backend local não encontrado em ${command}. Rode "cargo build -p c3-example" ou defina C3_API_URL / C3_BACKEND.`);
  }
  const side = await startSidecar({ command, env: { DATABASE_URL: `sqlite://${join(dataDir, 'c3.db')}` } });
  return { apiUrl: side.url, label: 'backend local', stop: side.stop };
}
