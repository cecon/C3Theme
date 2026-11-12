// Testes e2e (pnpm e2e): fluxos de usuário no navegador, contra o build de produção de cada app.
import { defineConfig, devices } from '@playwright/test';

// o app do create-app só existe enquanto o scripts/create-app-smoke.mjs roda: ele gera, sobe e passa a URL
const createAppUrl = process.env.E2E_CREATE_APP_URL;

const vitrineAndStorybook = {
  projects: [
    { name: 'vitrine', testMatch: 'vitrine-*.spec.ts', use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'storybook', testMatch: 'storybook*.spec.ts', use: { baseURL: 'http://127.0.0.1:6007' } }
  ],
  webServer: [
    {
      command: 'pnpm --filter @c3theme/showcase exec vite preview --port 4173 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'pnpm --filter @c3theme/storybook exec vite preview --outDir dist --port 6007 --strictPort --host 127.0.0.1',
      url: 'http://127.0.0.1:6007/iframe.html',
      reuseExistingServer: !process.env.CI
    }
  ]
};

const createApp = { projects: [{ name: 'create-app', testMatch: 'create-app.spec.ts', use: { baseURL: createAppUrl } }] };

export default defineConfig({
  ...(createAppUrl ? createApp : vitrineAndStorybook),
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { trace: 'off', locale: 'pt-BR', ...devices['Desktop Chrome'] }
});
