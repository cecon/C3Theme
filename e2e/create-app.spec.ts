// App gerado pelo pnpm create-app (front só com a C3Shell + backend real): o menu e as telas vêm do backend.
// Roda dentro do scripts/create-app-smoke.mjs, que gera o app, sobe a API e o front e passa a URL em E2E_CREATE_APP_URL.
import { expect, test } from '@playwright/test';

test('gravar um contato pela tela e vê-lo na lista depois de recarregar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Contatos ativos')).toBeVisible();

  await page.getByRole('link', { name: 'Contatos' }).first().click();
  await page.getByRole('button', { name: /adicionar contato/i }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Ana E2E');
  await page.getByRole('textbox', { name: 'E-mail' }).fill('ana.e2e@exemplo.com');
  await page
    .getByRole('button', { name: /salvar|gravar/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/contact\/[^/]+$/);

  // recarregar prova que gravou no backend (não só no estado da tela)
  await page.goto('/contact');
  await expect(page.getByRole('cell', { name: 'Ana E2E' })).toBeVisible();
});
